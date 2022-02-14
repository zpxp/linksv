// https://facebook.github.io/create-react-app/docs/running-tests#initializing-test-

// make sure all available functions in browser also exist in tests
import "../polyfills";

function createXHRmock() {
	let currentResps = [];

	const mock = jest.fn();

	// be aware we use *function* because we need to get *this*
	// from *new XmlHttpRequest()* call
	const send = jest.fn().mockImplementation(function() {
		this.onload = jest.fn();
		this.onerror = jest.fn();

		function getResponse() {
			let resp = currentResps[0];
			if (!isNaN(resp.amount)) {
				if (resp.amount === 0) {
					currentResps.splice(0, 1);
					return getResponse();
				} else {
					resp.amount--;
					return resp;
				}
			} else {
				return resp;
			}
		}

		setTimeout(() => {
			this.readyState = XMLHttpRequest.DONE;
			this.status = 200;
			const resp = getResponse();

			if (resp) {
				if (typeof resp.data === "object") {
					this.responseText = JSON.stringify(resp.data);
				} else {
					this.responseText = resp.data.toString();
				}
			} else {
				this.responseText = "";
			}

			this.onreadystatechange();
		}, 10);
	});

	const xhrMockClass = () => {
		return {
			open: jest.fn(),
			send: send,
			setRequestHeader: jest.fn()
		};
	};

	window.XMLHttpRequest = jest.fn().mockImplementation(xhrMockClass);

	window.setMockHttpResult = data => {
		if (data.override) {
			currentResps = [data];
		} else {
			currentResps.push(data);
		}
	};

	window.clearMockHttpResult = () => {
		currentResps = [];
	};
}

createXHRmock();
