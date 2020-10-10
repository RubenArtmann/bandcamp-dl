function sleep(time:number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

let url = Deno.args[0];
if(!url) throw new Error("No Url given!");


const getAlbumsFromArtistUrl = async(url:string)=>{
	let urlBase = url.split("/").slice(0,3).join("/");
	let r = await fetch(url);
	let string = await r.text();
	let result = string.match(/album\/[^\"?&#]+/g);
	if(!result) throw new Error("");
	let tracks = result.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>`${urlBase}/${t}`);
	return tracks;
};

const getTrackURLsFromAlbumURL = async(url:string)=>{
	let urlBase = url.split("/").slice(0,3).join("/");
	let r = await fetch(url);
	let string = await r.text();
	let result = string.match(/track\/[^\"?&#]+/g);
	if(!result) {console.log(url,string);return [];} //album of other artist
	let tracks = result.filter((v:string,i:number,a:string[])=>a.indexOf(v)===i).map((t)=>`${urlBase}/${t}`);
	return tracks;
};

const getFileURLsFromTrackURL = async(url:string)=>{
	let r = await fetch(url);
	let string = (await r.text()).replace(/&amp;/g,"&");
	let result = string.match(/https:[^:]+stream\/[\s\S]*?&quot/g);
	if(!result) throw new Error(string);
	
	return result.map((e)=>({trackUrl:url,fileUrl:e}));
};

let albums = [url]
if(!url.match(/bandcamp\.com\/(album|track)/)) {
	albums = await getAlbumsFromArtistUrl(url);
	console.log(albums);
}
let tracks = [url];
if(!url.match(/bandcamp\.com\/track/)) {
	tracks = [];
	for(let i=0; i<albums.length; i++) {
		let result = await getTrackURLsFromAlbumURL(albums[i]);
		tracks.push(...result);
		console.log(...result);
		await sleep(300);
	}
}
let files = [];
for(let i=0; i<tracks.length; i++) {
	let result = await getFileURLsFromTrackURL(tracks[i]);
	files.push(...result);
	console.log(...result);
	await sleep(300);
}
for(let i=0; i<files.length; i++) {
	let file = files[i];
	let artist = file.trackUrl.split("/")[2].split(".")[0];
	let track = file.trackUrl.split("/")[4];
	let title = `${artist} - ${track}`;
	let p = Deno.run({
	  cmd: ["curl", "--create-dirs", "-o", "./downloaded/"+title+".mp3", file.fileUrl],
	});
	await p.status();
}
console.log(files);