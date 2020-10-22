# bandcamp-dl
### install
1. download Deno from [here](https://deno.land/#installation)
2. run ```deno install --name=bandcamp-dl --allow-net --allow-read --allow-write https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts```
3. you might need to check if your path is configured correctly
(alternatively you can directly use it with ```deno run --allow-net --allow-read --allow-write https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts```)
### usage
run ```bandcamp-dl <args> <bandcamp_urls>```
* where ```<args>``` can be:
	* ```-d=<integer>```
		* delay in milliseconds between requests
		* default: ```300```
	* ```-o=<pattern>```
		* specifies the path and filename of each track (extension is always ```.mp3```)
		* default: ```./downloads/{artist}/{album}/{track}```
		* ```{<label|artist|album|track>}``` gets replaced by the specific property of the file being downloaded 
	* ```-s```
		* enables slugification of filenames
		* use if your filesystem does not support unicode (or you do not want it)
* where ```<bandcamp_urls>``` can be any number of:
	* ```https://<label>.bandcamp.com/artists``` (download whole label)
	* ```https://<artist>.bandcamp.com``` (download whole artist)
	* ```https://<artist>.bandcamp.com/album/<album>``` (download whole album)
	* ```https://<artist>.bandcamp.com/track/<track>``` (download track)
	* append ```#album=<album>``` so it knows the album of the file, otherwise ```{album}``` may be ```unknown```
	* append ```#label=<label>``` so it knows the label of the file, otherwise ```{label}``` may be ```unknown```

(if it crashes just rerun and it should skip already downloaded tracks)

### upgrade
running ```deno install -fr --name=bandcamp-dl --allow-net --allow-read --allow-write https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts``` upgrades to latest version

### repository
If you have any feature requests or ran into any problems or questions, feel free to open an issue.
However please open one issue per request/problem.
