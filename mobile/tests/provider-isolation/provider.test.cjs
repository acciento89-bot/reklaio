// Execute the actual PurchasesProvider with real React hooks. Only native/store,
// authentication and network boundaries are replaced; no real transactions exist.
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const React=require('react');const Renderer=require('react-test-renderer');
const ts=require('../../node_modules/typescript');
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
async function exercise(development,flag,disabled){
 const calls=[];const record=(name,value)=>async(...args)=>{calls.push({name,args});return value;};
 const free={entitlements:{active:{}},managementURL:null};
 const pro={entitlements:{active:{pro:{isActive:true}}},managementURL:'https://apps.apple.com/account/subscriptions'};
 const monthly={identifier:'$rc_monthly',packageType:'MONTHLY',offeringIdentifier:'default',product:{identifier:'fixture.monthly',priceString:'€1.99'}};
 const offering={identifier:'default',serverDescription:'Owned synthetic fixture',metadata:{},availablePackages:[monthly],monthly};
 const sdk={setLogLevel:(...args)=>calls.push({name:'log',args}),configure:(...args)=>calls.push({name:'configure',args}),
 getCustomerInfo:record('customer',free),getOfferings:record('offerings',{current:offering,all:{default:offering}}),
 logIn:record('login',{customerInfo:free}),purchasePackage:record('purchase',{customerInfo:pro}),restorePurchases:record('restore',pro)};
 const auth={status:'authenticated',token:'synthetic-never-transmitted',user:{id:'owned-synthetic-fixture',planCode:'free'},refreshUser:record('refreshUser')};
 const native={Platform:{OS:'ios'},Linking:{openURL:record('manage')}};
 const input=fs.readFileSync(path.resolve(__dirname,'../../src/purchases-context.tsx'),'utf8');
 const code=ts.transpileModule(input,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const mod={exports:{}};const boundary=(id)=>{
  if(id==='react')return React;if(id==='react/jsx-runtime')return require('react/jsx-runtime');
  if(id==='react-native')return native;
  if(id==='react-native-purchases')return {__esModule:true,default:sdk,LOG_LEVEL:{DEBUG:'DEBUG',WARN:'WARN'}};
  if(id==='@/src/auth-context')return {useAuth:()=>auth};
  if(id==='@/src/api')return {syncSubscriptionRequest:record('sync')};
  throw Error('Unexpected boundary '+id);
 };
 vm.runInNewContext(code,{require:boundary,module:mod,exports:mod.exports,__DEV__:development,console,process:{env:{EXPO_PUBLIC_REVENUECAT_IOS_API_KEY:'synthetic-provider-key',EXPO_PUBLIC_REKLAIO_PROVIDER_DISABLED_QA:flag}},setTimeout,clearTimeout});
 let value;function Probe(){value=mod.exports.usePurchases();return null;}
 let tree;try{
  await React.act(async()=>{tree=Renderer.create(React.createElement(mod.exports.PurchasesProvider,null,React.createElement(Probe)));});
  if(disabled){
   assert.equal(calls.length,0,'explicit debug isolation must prevent initial provider configuration and catalog/entitlement reads');
   assert.equal(value.available,false);assert.equal(value.isPro,false);
   await React.act(async()=>{await value.refresh();await assert.rejects(value.purchaseMonthly());await assert.rejects(value.restorePurchases());await value.openSubscriptionManagement();});
   assert.deepEqual(calls,[],'explicit QA operations must never reach store, server synchronization or management');
   assert.equal(value.isPro,false,'QA does not grant Pro');
  }else{
   assert.equal(value.available,true);assert.equal(value.isPro,false);
   await React.act(async()=>{await value.refresh();assert.equal(await value.purchaseMonthly(),'purchased');assert.equal(await value.restorePurchases(),true);await value.openSubscriptionManagement();});
   for(const name of ['configure','customer','offerings','purchase','restore','sync','refreshUser','manage'])assert.ok(calls.some(c=>c.name===name),'ordinary provider path retained: '+name);
   assert.deepEqual(calls.find(c=>c.name==='purchase').args,[monthly]);
  }
 }finally{if(tree)await React.act(async()=>tree.unmount());}
}
test('explicit debug QA prevents all real provider-boundary operations without granting Pro',()=>exercise(true,'1',true));
test('ordinary development retains the existing catalog, purchase, restore and sync paths using fakes only',()=>exercise(true,'0',false));
test('release ignores the QA environment flag and preserves ordinary store operations using fakes only',()=>exercise(false,'1',false));
