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