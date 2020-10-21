# bandcamp-dl
### usage
1. download Deno from [here](https://deno.land/#installation)
2. make sure you have curl installed
3. run ```deno run --allow-net --allow-run --allow-read https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts <args> <bandcamp_urls>```
	* where ```<args>``` can be:
		* ```d=<integer>```
			* delay in milliseconds between requests
		* ```o=<pattern>```
			* specifies the path and filename of each track (extension is always ```.mp3```)
			* default: ```./downloads/{artist}/{album}/{track}```
			* ```{<label|artist|album|track>}``` gets replaced by the specific property of the file being downloaded 
	* where ```<bandcamp_urls>``` can be any number of:
		* ```https://<label>.bandcamp.com/artists``` (download whole label)
		* ```https://<artist>.bandcamp.com``` (download whole artist)
		* ```https://<artist>.bandcamp.com/album/<album>``` (download whole album)
		* ```https://<artist>.bandcamp.com/track/<track>``` (download track)
		* append ```#album=<album>``` so it knows the album of the file, otherwise ```{album}``` may be ```unknown```
		* append ```#label=<label>``` so it knows the label of the file, otherwise ```{label}``` may be ```unknown```

(if it crashes just rerun and it should skip already downloaded tracks)

### upgrade
running ```deno cache --reload https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts``` upgrades to latest version

### repository
if you have any feature requests or ran into any problems or questions, feel free to open an issue
