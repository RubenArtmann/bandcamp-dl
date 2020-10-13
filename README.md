# bandcamp-dl
1. download Deno from [here](https://deno.land/#installation)
2. make sure you have curl installed
3. run ```deno run --allow-net --allow-run --allow-read https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts <bandcamp_urls>```

    where ```<bandcamp_urls>``` can be any number of:
	* ```https://<artist>.bandcamp.com``` (download whole artist)
	* ```https://<artist>.bandcamp.com/album/<album>``` (download whole album)
	* ```https://<artist>.bandcamp.com/track/<track>``` (download track)
4. the result will be saved in ./downloads (relative to cwd)

(if it crashes just rerun and it should skip already downloaded tracks)
