# bandcamp-dl
1. download Deno from [here](https://deno.land/#installation)
2. make sure you have curl installed
3. run ```deno run --allow-net --allow-run https://raw.githubusercontent.com/RubenArtmann/bandcamp-dl/main/mod.ts <bandcamp_url>```

    where ```<bandcamp_url>``` can be:
	* ```https://<artist>.bandcamp.com```
	* ```https://<artist>.bandcamp.com/album/<album>```
	* ```https://<artist>.bandcamp.com/track/<track>```
