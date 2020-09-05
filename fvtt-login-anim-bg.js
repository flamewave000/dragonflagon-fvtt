// ==UserScript==
// @name         Foundry VTT Animated Background
// @namespace    https://github.com/flamewave000
// @version      0.1
// @description  Reads the "background image" URL and if it is a video link, adds it to the page as such.
// @author       flamewave000
// @match        http*://*/join
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

(function() {
    'use strict';
    const FIT_TYPES = ['cover', 'fill', 'contain', 'scale-down', 'none'];
    const bgImg = $('body').css('background-image');
    const reg = /url\( *['"]([\w\W]+?)['"] *\)/;
    let url = reg.exec(bgImg)[1];
    if (url === undefined) return;
    url = url.split('.');
    let end = url.pop().split('?')[1];
    let fit = 'cover';
    if (end !== undefined && FIT_TYPES.includes(end.toLowerCase()))
        fit = end.toLowerCase();
    url = url.join('.');
    let video = $('<video />', {
        id: 'bg-video',
        controls: false,
        loop: true,
        autoplay: true,
        css: {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100vh",
            "z-index": "-1",
            "object-fit": fit
        }
    });
    $('<source />', {src: url + '.mp4', type: 'video/mp4'}).appendTo(video);
    $('<source />', {src: url + '.m4v', type: 'video/x-m4v'}).appendTo(video);
    $('body').prepend(video);
})();

