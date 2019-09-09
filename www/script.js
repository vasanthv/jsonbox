const request = (url, method, params, token) => {
	return new Promise((resolve, reject) => {
		let status = 500;
		var paramsToURL = obj => Object.keys(obj).map(key => key + "=" + obj[key]).join("&");
		let headers = { "Content-type": "application/json" };
		if (token) headers['Authorization'] = "Bearer " + token;
		window.fetch(url + ((method === "GET" || method === "DELETE") ? "?" + paramsToURL(params) : ""), {
				method: method,
				body: params && (method !== "GET" && method !== "DELETE") ? JSON.stringify(params) : undefined,
				headers: headers
			}).then(response => {
				status = response.status;
				return response.json();
			}).then(body => status >= 200 && status < 300 ? resolve(body) : reject(body))
			.catch(err => reject(err));
	});
};
const firebaseInit = () => {
	const config = {
		apiKey: "AIzaSyBqoW0dvi7Kk7W5EB8Og8yD4TcCu40l0dc",
		authDomain: "itsahoy-com.firebaseapp.com",
		databaseURL: "https://itsahoy-com.firebaseio.com",
		projectId: "itsahoy-com",
		storageBucket: "itsahoy-com.appspot.com",
		messagingSenderId: "204047715745"
	};
	try {
		firebase.apps.length == 0 && firebase.initializeApp(config);
		const messaging = firebase.messaging();
		messaging.onTokenRefresh(() => {
			messaging.getToken()
				.then(refreshedToken => request("/api/devicetoken", "PUT", { devicetoken: refreshedToken }, hoyApp.token))
				.catch(e => {
					console.log(e);
					hoyApp.startIntervalFetch();
				});
		});
		messaging.requestPermission()
			.then(() => messaging.getToken())
			.then(currentToken => request("/api/devicetoken", "PUT", { devicetoken: currentToken }, hoyApp.token))
			.catch(error => {
				console.log(error);
				hoyApp.startIntervalFetch();
			});
		messaging.onMessage(payload => {
			hoyApp.getMessages(true);
			if ("Notification" in window) {
				if (Notification.permission === "granted") {
					var notification = new Notification(payload.data.title, { body: payload.data.body, icon: '/icon.png' });
					notification.onclick = (event) => { notification.close(); }
				}
			}
		});
		if ("Notification" in window) Notification.requestPermission();
	} catch (e) {
		hoyApp.startIntervalFetch();
	}
};
const initialState = () => ({
	online: true,
	loading: false,
	error: '',
	geoLocation: null,
	showMenu: false,
	handle: window.localStorage.handle,
	token: window.localStorage.token,
	typing: '',
	place: '',
	feed: '',
	messages: [],
	activeMessage: '',
	blockedCount: 0,
	blockedUsers: [],
	unreadMessages: 0,
	fetchingMessages: null,
	fetched: false,
	showLoadMore: false,
	darkMode: window.localStorage.darkMode,
	peeking: false
});
const hoyApp = new Vue({
	el: '#hoy-app',
	data: initialState(),
	methods: {
		getLocation: function() {
			this.loading = true;
			navigator.geolocation.getCurrentPosition((pos) => {
				this.init(pos.coords.latitude + "," + pos.coords.longitude);
			}, (err) => {
				this.loading = false;
				this.error = 'Unable to get your location<br/><span class="small light">' + err.message + '</span>';
			}, { maximumAge: 60000, timeout: 15000, enableHighAccuracy: true });
		},
		init: function(geoLocation) {
			this.error = '';
			this.geoLocation = geoLocation;
			this.getMessages();
			this.getLocationName();
			this.loading = false;
			this.token ? firebaseInit() : this.startIntervalFetch();
		},
		getLocationName: function() {
			const pos = this.geoLocation.split(',');
			request('https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&namedetails=1' +
				'&lat=' + pos[0] + '&lon=' + pos[1]).then(reverseGeoCode => {
				this.place = (reverseGeoCode.namedetails.name || reverseGeoCode.address[Object.keys(reverseGeoCode.address)[0]]) + (reverseGeoCode.address.city ? ', ' + reverseGeoCode.address.city : '');
			});
		},
		showError: function(msg) {
			this.error = (typeof msg == 'string' ? msg : msg.message);
		},
		edit: function(e) {
			this.typing = e.srcElement.textContent;
		},
		paste: function(e) {
			e.preventDefault();
			const clipboardData = e.clipboardData || window.clipboardData;
			const pastedText = clipboardData.getData("Text");
			document.execCommand("inserttext", false, pastedText.replace(/(\r\n\t|\n|\r\t)/gm, " "));
		},
		submit: function(e) {
			e.stopPropagation();
			e.preventDefault();
			this.error = '';
			let requestPromise = null;
			if (this.token) {
				requestPromise = request("/api/messages", "POST", { message: this.typing, location: this.geoLocation }, this.token);
			} else {
				requestPromise = request("/api/auth", "POST", { handle: this.typing.trim() });
			}
			requestPromise.then(response => {
				if (this.token) {
					this.messages.unshift(response);
				} else {
					this.handle = window.localStorage.handle = response.handle;
					this.token = window.localStorage.token = response.token;
					firebaseInit();
				}
				this.typing = '';
				document.getElementById('omnibox').textContent = '';
			}).catch(err => this.showError(err)).then(e => document.getElementById('omnibox').blur());

		},
		feedChange: function(feed) {
			this.feed = feed;
			this.messages = [];
			this.fetched = false;
			this.getMessages();
			this.showMenu = false;
		},
		getMessages: function(getNew) {
			if (this.online && !this.fetchingMessages && this.geoLocation) {
				this.fetchingMessages = true;
				let params = { location: this.geoLocation };
				if (!getNew && this.messages.length > 0) params['skip'] = this.messages.length;
				if (getNew && this.messages.length > 0) params['lastdate'] = this.messages[0].date; // if no messages send current date
				request("/api/messages" + this.feed, "GET", params, this.token).then(response => {
					this.fetched = true;
					this.fetchingMessages = false;
					this.unreadMessages = response.notifications;
					this.blockedCount = response.blocked;
					if (response.messages.length > 0) {
						if (getNew) response.messages.reverse().forEach(m => this.messages.unshift(m));
						else response.messages.forEach(m => this.messages.push(m));
					}
					if (!getNew) this.showLoadMore = response.messages.length == 50;
				}).catch(err => {
					this.fetchingMessages = false;
					if (err.action == 'logout') this.logout(true);
				});
			}
		},
		startIntervalFetch: function() {
			setInterval(() => { this.getMessages(true); }, 10000);
		},
		displayHandle: function(from) {
			const showHandle = from.split("~");
			return showHandle[0] + (showHandle.length > 1 ? " 👻" : "");
		},
		formattedDate: function(date) {
			var units = [
				{ name: "s", limit: 60, in_seconds: 1 },
				{ name: "m", limit: 3600, in_seconds: 60 },
				{ name: "h", limit: 86400, in_seconds: 3600 },
				{ name: "d", limit: 604800, in_seconds: 86400 },
				{ name: "w", limit: 2629743, in_seconds: 604800 },
				{ name: "M", limit: 31556926, in_seconds: 2629743 },
				{ name: "Y", limit: null, in_seconds: 31556926 }
			];
			var diff = (new Date() - new Date(date)) / 1000;
			if (diff < 5) return "now";

			var i = 0,
				unit;
			while (unit = units[i++]) {
				if (diff < unit.limit || !unit.limit) {
					var diff = Math.floor(diff / unit.in_seconds);
					return diff + unit.name;
				}
			};
		},
		fullDate: function(datestring) {
			const date = new Date(datestring);
			const hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
			return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()] + ' ' +
				(date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' +
				(date.getFullYear() != (new Date()).getFullYear() ? date.getFullYear() : '') + ' - ' +
				(hours < 10 ? '0' + hours : hours) + ':' +
				(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ' ' +
				(date.getHours() >= 12 ? 'PM' : 'AM');
		},
		linkify: function(str) {
			var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
			var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
			var emailAddressPattern = /\w+@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6})+/gim;
			return str.replace(urlPattern, '<a href="$&" target="_blank" class="link" rel="noopener">$&</a>')
				.replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank" class="link" rel="noopener">$2</a>')
				.replace(emailAddressPattern, '<a href="mailto:$&" target="_blank" class="link" rel="noopener">$&</a>');
		},
		deleteMessage: function(id) {
			if (confirm("Are you sure you want to delete this message?")) {
				request("/api/messages", "DELETE", { id }, this.token).then((r) => {
					this.messages.splice(this.messages.findIndex(m => (m._id == id)), 1);
				}).catch(this.showError);
			}
		},
		blockUser: function(handle) {
			if (confirm("Are you sure you want to block @" + handle + "?")) {
				request("/api/block/" + handle, "GET", {}, this.token).then((r) => {
					this.error = '@' + this.displayHandle(handle) + ' Blocked';
					setTimeout(() => (this.error = ''), 3000);
					this.blockedCount = this.blockedCount + 1;
				}).catch(this.showError);
			}
		},
		unBlockUser: function(handle) {
			if (confirm("Are you sure you want to unblock @" + handle + "?")) {
				request("/api/block/" + handle, "DELETE", {}, this.token).then((r) => {
					this.error = '@' + this.displayHandle(handle) + ' unblocked';
					this.getBlockedUsers();
					setTimeout(() => (this.error = ''), 3000);
				}).catch(this.showError);
			}
		},
		mentionUser: function(handle) {
			const placeCaretAtEnd = (el) => {
				el.focus();
				let range = document.createRange();
				range.selectNodeContents(el);
				range.collapse(false);
				let sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
			const message = this.typing + (((this.typing.length > 0 && this.typing.slice(-1) != ' ') ? ' ' : '') + '@' + handle + '\t\b');
			this.typing = document.getElementById('omnibox').textContent = message;
			placeCaretAtEnd(document.getElementById('omnibox'));
		},
		onMessageClick: function(e) {
			e.stopPropagation();
			e.preventDefault();
			const msgid = e.target.getAttribute('data-id');
			this.activeMessage = (this.activeMessage == msgid ? null : msgid);
		},
		getBlockedUsers: function() {
			request("/api/blocked", "GET", {}, this.token).then(response => {
				this.blockedUsers = response.blocked;
				this.blockedCount = response.blocked.length;
				this.showMenu = false;
			}).catch(this.showError);
		},
		logout: function(skip) {
			const logout = () => {
				const localClear = () => {
					window.localStorage.clear();
					document.getElementById('omnibox').textContent = '';
					this.typing = '';
					this.token = this.handle = null;
					this.showMenu = false;
					this.setColorVariables();
				}
				request("/api/logout", "DELETE", {}, this.token).then(localClear).catch(localClear);
			};
			if (skip === true || confirm("By logging out you will lose all control over this profile. Your old messages will show a ghost icon near your handle. This handle will be instantly available for anyone to register. \n\nAre you sure you want to log out?"))
				logout();
		},
		toggleDarkMode: function() {
			this.darkMode = window.localStorage.darkMode = !this.darkMode;
			!this.darkMode && localStorage.removeItem('darkMode');
			this.setColorVariables();
			this.showMenu = false;
		},
		setColorVariables: function() {
			document.documentElement.style.setProperty('--background-color', this.darkMode ? '#222222' : '#ffffff');
			document.documentElement.style.setProperty('--text-dark', this.darkMode ? '#efefef' : '#000000');
			document.documentElement.style.setProperty('--text', this.darkMode ? '#cccccc' : '#444444');
			document.documentElement.style.setProperty('--text-vlight', this.darkMode ? '#333333' : '#f0f0f0');
		}
	}
});
window.addEventListener('click', () => {
	if (hoyApp.activeMessage) {
		hoyApp.activeMessage = null;
	}
});
window.addEventListener('online', () => (hoyApp.online = navigator.onLine));
window.addEventListener('offline', () => (hoyApp.online = navigator.onLine));

(() => {
	// if redirected from ahoy.fm
	if (window.location.search) {
		const paramsArr = window.location.search.substr(1).split('&');
		const params = {};
		paramsArr.forEach(p => (params[p.split('=')[0]] = p.split('=')[1]));
		if (params.lat && params.lng) {
			hoyApp.peeking = true;
			hoyApp.init(params.lat + "," + params.lng);
		}
	}
})();

(function() {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("/sw.js");
		navigator.serviceWorker.addEventListener("message", event => hoyApp.getMessages(true));
	}
	hoyApp.online = navigator.onLine;
	hoyApp.darkMode && hoyApp.setColorVariables();
	(hoyApp.token && !hoyApp.peeking) && setTimeout(hoyApp.getLocation, 100);
})();
