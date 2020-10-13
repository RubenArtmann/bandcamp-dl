import { exists } from "https://deno.land/std@0.74.0/fs/exists.ts";

function sleep(time:number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

let urlPool = [...Deno.args];
if(urlPool.length<1) throw new Error("No Url given!");

const dump = (url: string,msg="")=>{
	console.log("failed at:",url);
	console.log("urlPool (without failed url):");
	console.log(urlPool.join("\n"));
	return new Error(msg);
};



while(urlPool.length>0) {
	let url = urlPool.shift() as string;
	let result = url.match(/^https?:\/\/([^.]+).bandcamp.com\/?(?:(album|track)\/([^#\/?]+))?$/);
	if(!result) throw new Error(url);
	let artist = result[1];
	let urlType = result[2];
	let id = result[3];
	// console.log(url,artist,urlType,id);
	switch (urlType) {
		case "album":
			let r = await fetch(`https://${artist}.bandcamp.com/album/${id}`);
			let string = await r.text();
			let result = string.match(/track\/[^\"?&#]+/g);
			if(!result) throw dump(url);
			let tracks = result.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>`https://${artist}.bandcamp.com/${t}`);
			urlPool.push(...tracks);
		break;
		case "track":{
			let title = `${artist} - ${id.replace(/-/g," ")}`;
			let path = "./downloaded/"+title+".mp3";
			if(await exists(path)) {
				console.log("skipping:",path);
				continue;
			}

			let r = await fetch(url);
			let string = (await r.text()).replace(/&amp;/g,"&");
			let result = string.match(/https:[^:]+stream\/[\s\S]*?&quot/g);
			if(!result) throw dump(url,string);
			if(result.length!==1) throw dump(url);
			let fileUrl = result[0];
			console.log(fileUrl);
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
				urlPool.push(`https://${artist}.bandcamp.com/${results[i]}`);
			}
		}
		break;
	}
	let artists = 0;
	let albums = 0;
	let tracks = 0;
	for(let i=0; i<urlPool.length; i++) {
		let result = urlPool[i].match(/^https?:\/\/([^.]+).bandcamp.com\/?(?:(album|track)\/([^#\/?]+))?$/);
		if(!result) throw dump(url);
		let artist = result[1];
		let urlType = result[2];
		let id = result[3];
		if(urlType === undefined) artists++;
		if(urlType === "album") albums++;
		if(urlType === "track") tracks++;
	}
	console.log(`[todo] artists: ${artists}, albums: ${albums}, tracks: ${tracks}`);
	await sleep(500);
}
