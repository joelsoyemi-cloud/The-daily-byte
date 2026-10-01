import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const {NextRequest}=require('next/server');
const code=ts.transpileModule(fs.readFileSync('lib/supabase/middleware.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
function middleware({user=null,role='contributor',status='active',exchangeError=null}={}){
  const exports={}; const calls=[];
  const createServerClient=(_url,_key,options)=>({
    auth:{
      async getUser(){options.cookies.setAll([{name:'session-a',value:'one',options:{httpOnly:true}},{name:'session-b',value:'two',options:{httpOnly:true}}]);return {data:{user}};},
      async exchangeCodeForSession(value){calls.push(value);options.cookies.setAll([{name:'session-a',value:'recovery',options:{httpOnly:true}}]);return {error:exchangeError};},
    },
    from(){return {select(){return this;},eq(){return this;},async single(){return {data:{role,status}};}}},
  });
  vm.runInNewContext(code,{exports,URL,process,require:name=>name==='@supabase/ssr'?{createServerClient}:require(name)});
  return {run:exports.updateSession,calls};
}
test('anonymous private routes preserve next path and all refreshed cookies',async()=>{
 const {run}=middleware();const result=await run(new NextRequest('https://example.com/editor/articles?page=2'));
 const url=new URL(result.headers.get('location'));assert.equal(url.pathname,'/login');assert.equal(url.searchParams.get('next'),'/editor/articles?page=2');
 assert.equal(result.cookies.get('session-a').value,'one');assert.equal(result.cookies.get('session-b').value,'two');
});
test('role and suspension checks still deny protected routes',async()=>{
 for(const [role,status,path]of [['reader','active','/dashboard'],['contributor','active','/admin'],['editor','suspended','/editor']]){
  const {run}=middleware({user:{id:'u'},role,status});const result=await run(new NextRequest('https://example.com'+path));
  assert.equal(new URL(result.headers.get('location')).pathname,'/unauthorized');
 }
});
test('recovery session can reach reset page and PKCE exchange preserves cookies',async()=>{
 const plain=middleware({user:{id:'u'}});const page=await plain.run(new NextRequest('https://example.com/reset-password'));assert.equal(page.headers.get('location'),null);
 const recovery=middleware();const result=await recovery.run(new NextRequest('https://example.com/reset-password?code=test-code'));
 assert.deepEqual(recovery.calls,['test-code']);assert.equal(result.headers.get('location'),'https://example.com/reset-password');assert.equal(result.cookies.get('session-a').value,'recovery');
});
test('invalid recovery links fail safely without propagating the code',async()=>{
 const {run}=middleware({exchangeError:{message:'internal'}});const result=await run(new NextRequest('https://example.com/reset-password?code=secret'));
 assert.equal(result.headers.get('location'),'https://example.com/login?error=invalid-link');
});
