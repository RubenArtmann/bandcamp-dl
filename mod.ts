import { exists } from "https://deno.land/std@0.74.0/fs/exists.ts";

import he from "https://jspm.dev/npm:he@1.2.0!cjs";

function sleep(time:number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

let urlPool: string[] = [];
let pattern = "./downloads/{artist}/{album}/{track}";
for(let i=0; i<Deno.args.length; i++) {
	let arg = Deno.args[i];
	if(arg.startsWith("-o=")) {
		pattern = arg.slice(3);
	}  else  {
		urlPool.push(arg);
	}
}
if(urlPool.length<1) throw new Error("No Url given!");

const dump = (url: string,msg="")=>{
	console.log("failed at:",url);
	console.log("urlPool (without failed url):");
	console.log(urlPool.join("\n"));
	return new Error(msg);
};



while(urlPool.length>0) {
	let url = urlPool.shift() as string;
	let result = url.match(/^https?:\/\/([^.]+)\.bandcamp\.com\/?(artists|album|track)?(?:\/([^\#\/?]+))?(\#[\s\S]*)?$/);
	if(!result) throw new Error(url);
	let artist = result[1];
	let urlType = result[2];
	let id = result[3];
	let hash = result[4] || "";
	// console.log(url,artist,urlType,id);
	switch (urlType) {
		case "artists":{// this is a label
			let r = await fetch(`https://${artist}.bandcamp.com/artists`);
			let string = await r.text();
			let result = string.match(/https:\/\/[^\.]+\.bandcamp\.com\?label=/g);
			if(!result) throw dump(url);
			let artists = result.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>t.slice(0,-7)+`#label=${artist}`);
			urlPool.push(...artists);
		}
		break;
		case "album":{
			let r = await fetch(`https://${artist}.bandcamp.com/album/${id}`);
			let string = await r.text();
			let result = string.match(/track\/[^\"?&#]+/g);
			if(!result) throw dump(url);
			let tracks = result.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>`https://${artist}.bandcamp.com/${t}#album=${id}`+hash);
			urlPool.push(...tracks);
		}
		break;
		case "track":{
			let label = "unknown";
			let album = "unknown";
			let track = id.replace(/-/g," ");

			let array = hash.slice(1).split("#");
			for(let i=0; i<array.length; i++) {
				if(array[i].startsWith("album=")) album = array[i].slice(6).replace(/-/g," ");
				if(array[i].startsWith("label=")) label = array[i].slice(6).replace(/-/g," ");
			}

			let r = await fetch(url);
			let string = (await r.text()).replace(/&amp;/g,"&");
			let result = string.match(/https:[^:]+stream\/[\s\S]*?&quot/g);
			if(!result) throw dump(url,string);
			if(result.length!==1) throw dump(url);
			let fileUrl = result[0];
			console.log(fileUrl);

			let optionalOverwrites = string.match(/<div id="name-section">\s*<h2 class="trackTitle">\s*([^<]+?)\s*<\/h2>\s*<h3 class="albumTitle">\s*from\s*<span>\s*<a href="[^"]+"><span class="fromAlbum">([^<]+)<\/span><\/a><\/span>\s*by\s*<span>\s*<a href="[^"]+">([^<]+)<\/a>/)
			if(optionalOverwrites) {
				track = he.decode(optionalOverwrites[1]);
				album = he.decode(optionalOverwrites[2]);
				artist = he.decode(optionalOverwrites[3]);
			}  else console.warn(`overwrites failed on: ${url}`);

			let path = pattern.replace(/{label}/g,label).replace(/{artist}/g,artist).replace(/{album}/g,album).replace(/{track}/g,track)+".mp3";
			if(await exists(path)) {
				console.log("skipping:",path);
				continue;
			}

			let p = Deno.run({
				cmd: ["curl", "--create-dirs", "-o", path, fileUrl],
			});
			await p.status();
		}
		break;
		
		default:{
			let r = await fetch(`https://${artist}.bandcamp.com/music`);
			let string = await r.text();
			let results = string.match(/(?:track|album)\/[^\"]+/g);
			if(!results) throw dump(url,string);
			for(let i=0; i<results.length; i++) {
				urlPool.push(`https://${artist}.bandcamp.com/${results[i]}`+hash);
			}
		}
		break;
	}
	let labels = 0;
	let artists = 0;
	let albums = 0;
	let tracks = 0;
	for(let i=0; i<urlPool.length; i++) {
		let result = urlPool[i].match(/^https?:\/\/([^.]+)\.bandcamp\.com\/?(artists|album|track)?(?:\/([^\#\/?]+))?(\#[\s\S]*)?$/);
		if(!result) throw dump(urlPool[i]);
		let artist = result[1];
		let urlType = result[2];
		let id = result[3];
		if(urlType === "artists") labels++;
		if(urlType === undefined) artists++;
		if(urlType === "album") albums++;
		if(urlType === "track") tracks++;
	}
	console.log(`[todo] labels: ${labels} artists: ${artists}, albums: ${albums}, tracks: ${tracks}`);
	await sleep(500);
}