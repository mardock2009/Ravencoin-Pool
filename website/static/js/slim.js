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
	'use strict';
	var loc    = window.location.pathname;
	var path   = loc.split('/');
	var isRtl  = false;
	var newloc = '';
	$('head').append('<link id="headerSkin" rel="stylesheet" href="">');
	$('body').on('click', '.template-options-btn', function(e) {
		e.preventDefault();
		$('.template-options-wrapper').toggleClass('show');
	});
	$('body').on('click', '.skin-light-mode', function(e) 	{
		e.preventDefault();
		newloc = loc.replace('template-dark', 'template');
		$(location).attr('href', newloc);
	});
	$('body').on('click', '.skin-dark-mode', function(e) {
		e.preventDefault();
		if(loc.indexOf('template-dark') >= 0) {
			newloc = loc;
		} else {
			newloc = loc.replace('template', 'template-dark');
		}
		$(location).attr('href', newloc);
	});
	$('body').on('click', '.slim-direction', function() {
		var val = $(this).val();
		if(val === 'rtl') {
			if(!isRtl) {
				if(path[3]) {
					newloc = '/slim/'+path[2]+'-rtl/'+path[3];
				} else {
					newloc = '/slim/'+path[2]+'-rtl/';
				}
				$(location).attr('href', newloc);
			}
		} else {
			if(isRtl) {
				if(path[3]) {
					newloc = '/slim/'+path[2].replace('-rtl','')+'/'+path[3];
				} else {
					newloc = '/slim/'+path[2].replace('-rtl','')+'/';
				}
				$(location).attr('href', newloc);
			}
		}
	});
	$('body').on('click', '.sticky-header', function() {
		var val = $(this).val();
		if(val === 'yes') {
			$.cookie('sticky-header', 'true');
			$('body').addClass('slim-sticky-header');
		} else {
			$.removeCookie('sticky-header');
			$('body').removeClass('slim-sticky-header');
		}
	});
	$('body').on('click', '.header-skin', function() {
		var val = $(this).val();
		if(val !== 'default') {
			$.cookie('header-skin', val);
			$('#headerSkin').attr('href','../css/slim.'+val+'.css');
		} else {
			$.removeCookie('header-skin');
			$('#headerSkin').attr('href', '');
		}
	});
	$('body').on('click', '.full-width', function() {
		var val = $(this).val();
		if(val === 'yes') {
			$.cookie('full-width', 'true');
			$('body').addClass('slim-full-width');
		} else {
			$.removeCookie('full-width');
			$('body').removeClass('slim-full-width');
		}
	});
});