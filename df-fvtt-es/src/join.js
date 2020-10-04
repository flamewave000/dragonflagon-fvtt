
const checkVideo = (url) => new Promise((res, _) => {
	let http = new XMLHttpRequest();
	http.open('HEAD', url);
	http.onload = (a) => res(a.target.status == 200);
	http.onerror = () => res(false);
	http.ontimeout = () => res(false);
	http.send();
});
function parseUrl(url) {
	const FIT_TYPES = ['cover', 'fill', 'contain', 'scale-down', 'none'];
	let query = url.split('?')[1];
	if (!query) return { mute: false, fit: false };
	query = query.split('&');
	if (query.length == 0) return { mute: false, fit: false };
	query = query.map(x => x.toLowerCase());
	return {
		mute: query.includes('mute'),
		fit: query.find(x => FIT_TYPES.includes(x))
	};
}

(async function () {
	'use strict';
	const body = $('body');
	const reg = /url\( *['"]([\w\W]+?)['"] *\)/;
	let url = reg.exec(body.css('background-image'))[1];
	if (url === undefined) return;

	let params = parseUrl(url);
	url = url.split('.'); url.pop(); url = url.join('.');
	let hasMp4 = await checkVideo(url + '.mp4');
	let hasM4v = await checkVideo(url + '.m4v');
	let hasOgg = await checkVideo(url + '.ogg');
	let hasWebm = await checkVideo(url + '.webm');
	if (!(hasMp4 || hasM4v || hasOgg || hasWebm)) return;

	let volume = window.localStorage.getItem('df-bg-volume') ?? '0.5';
	let video = $('<video id="df-bg-video" class="df-anim-bg" loop autoplay />');
	video.prop('volume', params.mute ? '0' : volume)
	video.css('object-fit', params.fit ? params.fit : 'cover');
	if (hasMp4) video.append(`<source src="${url}.mp4" type="video/mp4" />`);
	if (hasM4v) video.append(`<source src="${url}.m4v" type="video/x-m4v" />`);
	if (hasOgg) video.append(`<source src="${url}.ogg" type="video/ogg" />`);
	if (hasWebm) video.append(`<source src="${url}.webm" type="video/webm" />`);
	body.prepend(video);
	if (params.mute) return;
	body.prepend(`	<form class="df-anim-bg" oninput="df_bg_update()">
		<input id="df-bg-volume" type="range" min="0" max="1" value="${volume}" step="0.05" />
	</form>`);
	body.append(`	<script>
		function df_bg_update() {
			let volumeElement = $('#df-bg-volume');
			$('#df-bg-video').prop("volume", volumeElement.val());
			window.localStorage.setItem('df-bg-volume', volumeElement.val());
		}
	</script>`);
})();