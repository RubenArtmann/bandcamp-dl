import { exists } from "https://deno.land/std@0.74.0/fs/exists.ts";

import _he from "https://jspm.dev/npm:he@1.2.0!cjs";
const he = _he as {decode: (string:string)=>string};

import _slug from "https://jspm.dev/limax@2.0.0";
const slug = _slug as (string: string,options: {})=>string;

let urlPool: string[] = [];
let pattern = "./downloads/{artist}/{album}/{track}";
let delay = 300;
let slugify = true;
for(let i=0; i<Deno.args.length; i++) {
	let arg = Deno.args[i];
	if(arg.startsWith("-o=")) {
		pattern = arg.slice(3);
	}  else  if(arg.startsWith("-d=")) {
		delay = parseInt(arg.slice(3));
	}  else  if(arg === "-s") {
		slugify = !slugify;
	}  else  if(arg === "--upgrade") {
		console.log("run deno install -fr --name=bandcamp-dl --allow-net --allow-read --allow-write --no-check https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts");
		Deno.exit();
	}  else  {
		urlPool.push(arg);
	}
}

const sleep = (time: number)=>new Promise(resolve=>setTimeout(resolve, time));

const download = async(url: string, path: string)=>{
	let r = await fetch(url);
	Deno.mkdirSync(path.split("/").slice(0,-1).join("/"), { recursive: true });
	Deno.writeFileSync(path,new Uint8Array(await r.arrayBuffer()));
};

const sanitizeFileName = (string: string)=>{
	string = string.replace(/[\|\\\/]/g,"I");
	if(slugify) {
		string = slug(string,{
			maintainCase: true,
			custom: ["'","(",")","+",",",";","=","#","[","]","@"].reduce((o,v)=>{return {[v]:v,...o};},{})
		});
	}
	string = string.replace(/\s/g,"_").replace(/[<>\?\*\:\"]/g,"").replace(/^\-/,"").replace(/^\.*$/,"dots");
	return string;
};


let urlPoolRegexp = /^(?:https?:\/\/)?([^.]+)\.bandcamp\.com\/?(artists|album|track)?(?:\/([^\#\/?]+))?(\#[\s\S]*)?$/;

const log = (...args:any[])=>console.log("\r\x1b[0J"+args[0],...args.slice(1));
const logStatus = (urlPool: string[])=>{
	let labels = 0;
	let artists = 0;
	let albums = 0;
	let tracks = 0;
	for(let i=0; i<urlPool.length; i++) {
		let result = urlPool[i].match(urlPoolRegexp);
		if(!result) {
			log(`could not understand ${urlPool[i]}: removed.`);
			throw new Error();
			urlPool.splice(i,1);
			continue;
		}
		let artist = result[1];
		let urlType = result[2];
		let id = result[3];
		if(urlType === "artists") labels++;
		if(urlType === undefined) artists++;
		if(urlType === "album") albums++;
		if(urlType === "track") tracks++;
	}
	Deno.stdout.writeSync(new TextEncoder().encode(`\r\x1b[0J[todo] labels: ${labels} artists: ${artists}, albums: ${albums}, tracks: ${tracks}`));
};

const filterUniques = (a: string[])=>a.sort().filter((e,i,a)=>e!==a[i+1]);


if(urlPool.length<1) throw new Error("No Url given!");
while(urlPool.length>0) {
	await sleep(delay);
	logStatus(urlPool);

	let url = urlPool.shift() as string;
	let result = url.match(urlPoolRegexp);
	if(!result) {
		log(`could not understand ${url}: skipping.`);
		continue;
	}
	let artist = result[1];
	let urlType = result[2];
	let id = result[3];
	let hash = result[4] || "";
	// log(url,artist,urlType,id);
	switch (urlType) {
		case "artists":{// this is a label
			let r = await fetch(`https://${artist}.bandcamp.com/artists`);
			let string = await r.text();
			let results = string.match(/https:\/\/[^\.]+\.bandcamp\.com\?label=/g);
			if(!results) {
				log(`could not find any artists on https://${artist}.bandcamp.com/artists: skipping.`);
				continue;
			}
			let artists = results.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>t.slice(0,-7)+`#label=${artist}`);
			urlPool.push(...artists);
		}
		break;
		case "album":{
			let r = await fetch(`https://${artist}.bandcamp.com/album/${id}`);
			let string = await r.text();
			let results = string.match(/info_link">\s*<a href="\/track\/[^\"?&#]+/g);
			if(!results) {
				log(`could not find any tracks on https://${artist}.bandcamp.com/album/${id}: skipping.`);
				continue;
			}
			let tracks = results.map(s=>(s.match(/track\/[^\"?&#]+/)||[null])[0]).filter(e=>e!==null).map((t)=>`https://${artist}.bandcamp.com/${t}#album=${id}`+hash);
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
			let result = string.match(/https:[^:]+stream\/[^;]+?(?=[\\"]|&quot)/g);
			if(!result) {
				log(`could not find a download url on ${url}: skipping.`);
				continue;
			}
			if(filterUniques([...result]).length!==1) {
				log(`found more than one download url on ${url}: skipping.`);
				continue;
			}
			let fileUrl = result[0];

			let optionalOverwrites = string.match(/<div id="name-section">\s*<h2 class="trackTitle">\s*([^<]+?)\s*<\/h2>\s*<h3 class="albumTitle">\s*(?:from\s*<span>\s*<a href="[^"]+"><span class="fromAlbum">([^<]+)<\/span><\/a><\/span>\s*)?by\s*<span>\s*<a href="[^"]+">([^<]+)<\/a>/);
			if(optionalOverwrites) {
				track = sanitizeFileName(he.decode(optionalOverwrites[1]));
				if(optionalOverwrites[2]) album = sanitizeFileName(he.decode(optionalOverwrites[2]));
				artist = sanitizeFileName(he.decode(optionalOverwrites[3]));
			}  else log(`overwrites failed on: ${url}`);

			let path = pattern.replace(/{label}/g,label).replace(/{artist}/g,artist).replace(/{album}/g,album).replace(/{track}/g,track)+".mp3";
			if(await exists(path)) {
				log(`already downloaded ${path} from ${url}: skipping.`);
				continue;
			}

			await download(fileUrl,path);
		}
		break;
		
		default:{
			let r = await fetch(`https://${artist}.bandcamp.com/music`);
			if(r.url !== `https://${artist}.bandcamp.com/music`) {
				log(`got redirected to ${r.url} while fetching https://${artist}.bandcamp.com/music: skipping.`);
				continue
			}
			let string = await r.text();
			let results = string.match(/(?:track|album)\/[^\"&?\']+/g);
			if(!results) {
				log(`could not find any albums or tracks on https://${artist}.bandcamp.com/music: skipping.`);
				continue;
			}
			for(let i=0; i<results.length; i++) {
				urlPool.push(`https://${artist}.bandcamp.com/${results[i]}`+hash);
			}
		}
		break;
	}
}
log("done!");
