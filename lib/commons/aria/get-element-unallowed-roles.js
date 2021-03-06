/* global aria */

/**
 * Returns all roles applicable to element in a list
 *
 * @method getRoleSegments
 * @private
 * @param {Element} node
 * @returns {Array} Roles list or empty list
 */

function getRoleSegments(node) {
	let roles = [];

	if (!node) {
		return roles;
	}

	if (node.hasAttribute('role')) {
		const nodeRoles = axe.utils.tokenList(
			node.getAttribute('role').toLowerCase()
		);
		roles = roles.concat(nodeRoles);
	}

	if (node.hasAttributeNS('http://www.idpf.org/2007/ops', 'type')) {
		const epubRoles = axe.utils
			.tokenList(
				node
					.getAttributeNS('http://www.idpf.org/2007/ops', 'type')
					.toLowerCase()
			)
			.map(role => `doc-${role}`);

		roles = roles.concat(epubRoles);
	}

	// filter invalid roles
	roles = roles.filter(role => axe.commons.aria.isValidRole(role));

	return roles;
}

/**
 * gets all unallowed roles for a given node
 * @method getElementUnallowedRoles
 * @param {Object} node HTMLElement to validate
 * @param {String} tagName tag name of a node
 * @param {String} allowImplicit option to allow implicit roles, defaults to true
 * @return {Array<String>} retruns an array of roles that are not allowed on the given node
 */
aria.getElementUnallowedRoles = function getElementUnallowedRoles(
	node,
	allowImplicit = true
) {
	const tagName = node.nodeName.toUpperCase();

	// by pass custom elements
	if (!axe.utils.isHtmlElement(node)) {
		return [];
	}

	const roleSegments = getRoleSegments(node);
	const implicitRole = axe.commons.aria.implicitRole(node);

	// stores all roles that are not allowed for a specific element most often an element only has one explicit role
	const unallowedRoles = roleSegments.filter(role => {
		// if role and implicit role are same, when allowImplicit: true
		// ignore as it is a redundant role
		if (allowImplicit && role === implicitRole) {
			return false;
		}

		// Edge case:
		// setting implicit role row on tr element is allowed when child of table[role='grid']
		if (
			!allowImplicit &&
			!(
				role === 'row' &&
				tagName === 'TR' &&
				axe.utils.matchesSelector(node, 'table[role="grid"] > tr')
			)
		) {
			return true;
		}

		// check if role is allowed on element
		if (!aria.isAriaRoleAllowedOnElement(node, role)) {
			return true;
		}
	});

	return unallowedRoles;
};
