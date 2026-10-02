import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { validateFeedback } from '../lib/feedback.ts';
import { validateAvatar, ownedAvatarPath } from '../lib/avatar.ts';

function load(file, imports) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, File, FormData, Uint8Array, URL, crypto, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.example.com' } }, require(name) { if (name in imports) return imports[name]; throw Error('Unexpected import: ' + name); } });
  return exports;
}
test('feedback validates bounded fields and strips URL tokens without fetching URLs', () => {
  const input = { type: 'bug', title: '  Broken page  ', message: 'Please fix this page.', email: 'tester@example.com', page_url: 'https://example.com/blog/story?token=secret#private' };
  const result = validateFeedback(input);
  assert.equal(result.p_page_url, 'https://example.com/blog/story');
  assert.equal(result.p_title, 'Broken page');
  for (const change of [{type:'admin'},{title:'a'.repeat(121)},{message:'tiny'},{email:'not-email'},{page_url:'javascript:alert(1)'},{page_url:'https://user:password@example.com/'}]) assert.throws(() => validateFeedback({...input,...change}));
});
test('feedback action submits only validated RPC arguments and hides database errors', async () => {
  let values, calls=0;
  const { submitFeedback } = load('app/feedback/actions.ts', { '@/lib/feedback': {validateFeedback}, '@/lib/supabase/server': {createClient:async()=>({rpc:async(name,input)=>{assert.equal(name,'submit_feedback');values=input;calls++;return {error:null};}})} });
  assert.equal((await submitFeedback({type:'bug',title:'Problem',message:'A useful bug report.',page_url:'',email:'',reporter_id:'evil',status:'resolved'})).ok,true);
  assert.equal(values.reporter_id,undefined);assert.equal(values.status,undefined);
  assert.equal((await submitFeedback({type:'bug',title:'',message:'A useful bug report.',page_url:'',email:''})).ok,false);
  assert.equal(calls,1);
  const failed = load('app/feedback/actions.ts', { '@/lib/feedback': {validateFeedback}, '@/lib/supabase/server': {createClient:async()=>({rpc:async()=>({error:{code:'XX000',message:'private database detail'}})})} });
  assert.doesNotMatch((await failed.submitFeedback({type:'bug',title:'Problem',message:'A useful bug report.',page_url:'',email:''})).message,/private database/);
});
test('avatar validation rejects active, mismatched, empty and oversized files', () => {
  for(const file of [{type:'image/svg+xml',size:20},{type:'image/gif',size:20},{type:'image/jpeg',size:0},{type:'image/webp',size:2097153}])assert.throws(()=>validateAvatar(file));
  assert.throws(()=>validateAvatar({type:'image/jpeg',size:20},new TextEncoder().encode('<svg onload=x>')));
  assert.doesNotThrow(()=>validateAvatar({type:'image/jpeg',size:20},new Uint8Array([255,216,255])));
  assert.doesNotThrow(()=>validateAvatar({type:'image/png',size:20},new Uint8Array([137,80,78,71,13,10,26,10])));
});
const id='10000000-0000-4000-8000-000000000002', object='20000000-0000-4000-8000-000000000002';
const old='https://storage.example.com/storage/v1/object/public/avatars/'+id+'/'+object+'.jpg';
test('avatar cleanup accepts only own managed paths on the configured storage origin', () => {
  assert.equal(ownedAvatarPath(old,id,'https://storage.example.com'),id+'/'+object+'.jpg');
  for(const url of [old.replace(id,object),old.replace('storage.example.com','evil.example'),old+'?x=1',old.replace('/avatars/','/media/'),old.replace(object+'.jpg','../private.jpg')])assert.equal(ownedAvatarPath(url,id,'https://storage.example.com'),null);
});
function avatarClient({save=true,upload=true,remove=true,throwSave=false}={}) {
  const events=[];
  const bucket={upload:async(path,_file,options)=>{events.push(['upload',path,options.upsert]);return {error:upload?null:{message:'failure'}};},getPublicUrl:path=>({data:{publicUrl:'https://storage.example.com/storage/v1/object/public/avatars/'+path}}),remove:async(paths)=>{events.push(['remove',...paths]);return {error:remove?null:{message:'failure'}};}};
  const client={storage:{from(name){assert.equal(name,'avatars');return bucket;}},from(name){assert.equal(name,'profiles');return {update(values){events.push(['save',values.avatar_url]);return this;},eq(key,value){events.push(['eq',key,value]);return this;},is(){return this;},select(){return this;},async maybeSingle(){if(throwSave)throw Error('network');return {data:save?{id}:null,error:null};}};}};
  return {client,events};
}
const image=()=>new File([new Uint8Array([255,216,255,0])],'picture.jpg',{type:'image/jpeg'});
function avatarService(){return load('lib/avatar-storage.ts',{'./avatar':{AVATAR_BUCKET:'avatars',ownedAvatarPath,validateAvatar}}).replaceOwnAvatar;}
test('avatar replacement saves the new URL before deleting the old object and never upserts',async()=>{
  const {client,events}=avatarClient();const result=await avatarService()(client,{id,avatar_url:old},image(),'https://storage.example.com');
  assert.equal(result.ok,true);assert.equal(events[0][0],'upload');assert.equal(events[0][2],false);assert.match(events[0][1],new RegExp('^'+id+'/'));
  assert.equal(events.at(-1)[0],'remove');assert.equal(events.at(-1)[1],id+'/'+object+'.jpg');
  assert.ok(events.find(row=>row[0]==='eq'&&row[1]==='avatar_url'&&row[2]===old));
});
test('a confirmed avatar save rejection preserves the old image and cleans up the new upload',async()=>{
  const {client,events}=avatarClient({save:false});
  assert.equal((await avatarService()(client,{id,avatar_url:old},image(),'https://storage.example.com')).ok,false);
  assert.equal(events.at(-1)[0],'remove');assert.equal(events.at(-1)[1],events[0][1]);assert.notEqual(events.at(-1)[1],id+'/'+object+'.jpg');
});
test('an uncertain save response never deletes an image that the profile may have committed',async()=>{
  const {client,events}=avatarClient({throwSave:true});
  const result=await avatarService()(client,{id,avatar_url:old},image(),'https://storage.example.com');
  assert.equal(result.ok,false);assert.match(result.message,/could not confirm/);assert.ok(!events.some(row=>row[0]==='remove'));
});
test('avatar upload failure never changes a profile; cleanup failure reports partial success',async()=>{
  const failed=avatarClient({upload:false});assert.equal((await avatarService()(failed.client,{id,avatar_url:old},image(),'https://storage.example.com')).ok,false);assert.equal(failed.events.length,1);
  const cleanup=avatarClient({remove:false});const result=await avatarService()(cleanup.client,{id,avatar_url:old},image(),'https://storage.example.com');assert.equal(result.ok,true);assert.match(result.message,/old image could not be removed/);
});
test('avatar and feedback management actions enforce server role guards before writes',async()=>{
  let clients=0;
  const server={'@/lib/supabase/server':{createClient:async()=>{clients++;throw Error('Unexpected database call');}},'next/cache':{revalidatePath(){}}};
  const avatar=load('app/dashboard/profile/avatar-actions.ts',{...server,'@/lib/auth':{requireContributor:async()=>{throw Error('denied');}},'@/lib/avatar-storage':{replaceOwnAvatar(){throw Error('Unexpected upload');}}});
  await assert.rejects(avatar.uploadAvatar(new FormData()),/denied/);
  const feedback=load('app/admin/feedback/actions.ts',{...server,'@/lib/auth':{requireAdmin:async()=>{throw Error('denied');}},'@/lib/feedback':{FEEDBACK_STATUSES:['new','reviewing','resolved','ignored']}});
  await assert.rejects(feedback.updateFeedbackStatus(id,'resolved'),/denied/);assert.equal(clients,0);
});
test('profile completion ignores injected role fields and preserves existing byline addresses',async()=>{
  let payload;
  const query={eq(){return this;},select(){return this;},async maybeSingle(){return {data:{id},error:null};}};
  const action=load('app/dashboard/profile/actions.ts',{'@/lib/auth':{requireContributor:async()=>({id,username:'existing-writer'})},'@/lib/supabase/server':{createClient:async()=>({from(){return {update(values){payload=values;return query;}};}})},'next/cache':{revalidatePath(){}}});
  assert.equal((await action.saveOwnProfile({display_name:'Writer',bio:'Bio',school_id:'',username:'changed',role:'admin'})).ok,true);assert.equal(payload.role,undefined);assert.equal(payload.username,undefined);
});
