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

var filterIterate = module.exports = function(iterateThis, replaceTypes, replaceLabel) {
	if (typeof iterateThis == 'object') {
		let iterateIndex = 1;
		for (let item in iterateThis) {
			if (typeof replaceTypes.prop !== 'undefined') {
				for (let prop of replaceTypes.prop) {
					iterateThis[item][prop] = replaceLabel + iterateIndex;
				}
			}
			if (typeof replaceTypes.split != 'undefined') {
				let splitString = String(iterateThis[item])
				let splitItem = splitString.split(replaceTypes.split.by);
				splitItem[replaceTypes.split.index] = replaceLabel + iterateIndex;
				splitItem = splitItem.join(':');
				iterateThis[item] = splitItem;
			}
			if (typeof replaceTypes.key !== 'undefined' && replaceTypes.key) {
				Object.defineProperty(iterateThis, replaceLabel + iterateIndex, Object.getOwnPropertyDescriptor(iterateThis, item));
				delete iterateThis[item];
			}
			iterateIndex++;
		}
	}
	return iterateThis;
}
