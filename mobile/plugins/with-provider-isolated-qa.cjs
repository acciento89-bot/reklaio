// Explicit Debug-only launch route for a bundled local QA JavaScript build.
// Normal Debug keeps Metro; Release never compiles the QA argument or route.
const {withAppDelegate}=require('expo/config-plugins');
const insertion='    // REKLAIO_PROVIDER_ISOLATED_QA\n    if ProcessInfo.processInfo.arguments.contains("--reklaioProviderDisabledQA") { return Bundle.main.url(forResource: "main", withExtension: "jsbundle") }\n';
function patchAppDelegate(source){
 if(source.includes('// REKLAIO_PROVIDER_ISOLATED_QA')){
  if(!source.includes(insertion))throw Error('Unknown partial Reklaio QA AppDelegate');
  return source;
 }
 const anchor='#if DEBUG\n    return RCTBundleURLProvider';
 if(source.split(anchor).length!==2||!source.includes('ExpoReactNativeFactoryProvider'))throw Error('Expected audited Expo57 scene AppDelegate');
 return (source.includes('import Foundation')?'':'import Foundation\n')+source.replace(anchor,'#if DEBUG\n'+insertion+'    return RCTBundleURLProvider');
}
function withProviderIsolatedQA(config){return withAppDelegate(config,result=>{
 if(result.modResults.language!=='swift')throw Error('Expected Swift AppDelegate');
 result.modResults.contents=patchAppDelegate(result.modResults.contents);return result;
});}
module.exports=withProviderIsolatedQA;module.exports.patchAppDelegate=patchAppDelegate;
