/*
Copyright 2021 JAMPS (jamps.pro)

Authors: Olaf Wasilewski (olaf.wasilewski@gmx.de)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction,
including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

$(function() {
	var hotSwap = function(page, pushSate) {
		if (pushSate) history.pushState(null, null, '/' + page);
		$('.pure-menu-selected').removeClass('pure-menu-selected');
		$('a[href="/' + page + '"]').parent().addClass('pure-menu-selected');
		$.get("/get_page", {id: page}, function(data) {
			$('main').html(data);
		}, 'html')
	};
	$('.hot-swapper').click(function(event) {
		if (event.which !== 1) return;
		var pageId = $(this).attr('href').slice(1);
		hotSwap(pageId, true);
		event.preventDefault();
		return false;
	});
	window.addEventListener('load', function() {
		setTimeout(function() {
			window.addEventListener("popstate", function(e) {
				hotSwap(location.pathname.slice(1));
			});
		}, 0);
	});
	window.statsSource = new EventSource("/api/live_stats");
});
