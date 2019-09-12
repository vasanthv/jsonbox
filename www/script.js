const copyURL = () => {
	/* Get the text field */
	var copyText = document.getElementById("boxurl");

	/* Select the text field */
	copyText.select();
	copyText.setSelectionRange(0, 99999); /*For mobile devices*/

	/* Copy the text inside the text field */
	document.execCommand("copy");
}

const thisApp = new Vue({
	el: '#app',
	data: {
		email: '',
		boxid: '',
		notice: '',
		orderComplete: false
	},
	computed: {
		isValidBoxId: function() {
			return /^([0-9A-Za-z_]){20,64}$/i.test(this.boxid);
		},
		isValidEmail: function() {
			var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(String(this.email).toLowerCase());
		}
	},
	methods: {
		generateBoxId: function() {
			this.boxid = 'box_' + create_UUID();
		},
		next: function() {
			if (!this.isValidEmail) {
				alert('Invalid Email');
			} else if (!this.isValidBoxId) {
				alert('Invalid Box id');
			} else {
				window.fetch('/' + this.boxid + '?limit=1000')
					.then(response => {
						if (response.status == 401) this.notice = 'This box is a private box. Click below to renew it.';
						return response.json();
					})
					.then(response => {
						if (Array.isArray(response))
							this.notice = 'This box has <strong>' + response.length + '</strong> records. Click below to buy.';
						document.querySelectorAll('#privateform input').forEach(n => (n.readOnly = true));
						document.querySelector('#generateBtn').disabled = true;
						this.validForm = true;
						loadPaypal();
					})
					.catch(err => console.log(err));
			}

			console.log('next clicked');
		}
	}
});

function toggleBuy() {
	document.getElementById('buy').style.display = document.getElementById('buy').style.display == 'none' ? 'block' : 'none';
	thisApp.email = '';
	thisApp.boxid = '';
	thisApp.notice = '';
	document.querySelectorAll('#privateform input').forEach(n => (n.readOnly = false));
	document.querySelector('#generateBtn').disabled = false;
}

function create_UUID() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
}

document.getElementById('boxurl').value = 'https://jsonbox.io/box_' + create_UUID();
