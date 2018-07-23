var userController = {
    data: {
        auth0Lock: null,
        config: null
    },
    eventHandlers: [],
    uiElements: {
        loginButton: null,
        logoutButton: null,
        profileButton: null,
        profileNameLabel: null,
        profileImage: null
    },
    init: function (config, eventHandlers) {
        var that = this;
        this.eventHandlers = eventHandlers;
        this.uiElements.loginButton = $('#auth0-login');
        this.uiElements.logoutButton = $('#auth0-logout');
        this.uiElements.profileButton = $('#user-profile');
        this.uiElements.profileNameLabel = $('#profilename');
        this.uiElements.profileImage = $('#profilepicture');
        this.data.config = config;
        this.data.auth0Lock = new Auth0Lock(config.auth0.clientId, config.auth0.domain, {
            auth: {
                responseType: 'id_token token',
                params: {
                    scope: config.auth0.scope,
                    audience: config.auth0.audience,
                    redirectUrl: "",
                    responseType: "token"
                }
            }
        }); // params set in config.js
        this.data.auth0Lock.on("authenticated", function (authResult) {
            that.retrieveProfileData(authResult.accessToken);
            localStorage.setItem('userToken', authResult.accessToken);
            for (var i = 0; i < that.eventHandlers.length; i++) {
                that.eventHandlers[i].onLogin();
            }
        });
        var idToken = localStorage.getItem('userToken');
        if (idToken) {
            this.retrieveProfileData(idToken);
            for (var i = 0; i < this.eventHandlers.length; i++) {
                this.eventHandlers[i].onLogin();
            }
        }
        this.wireEvents();
    },
    retrieveProfileData: function (accessToken) {
        var that = this;
        this.configureAuthenticatedRequests();
        this.data.auth0Lock.getUserInfo(accessToken, function (err, profile) {
            if (err) {
                return alert('There was an error getting the profile: ' + err.message);
            }
            that.showUserAuthenticationDetails(profile);
        });
    },
    configureAuthenticatedRequests: function () {
        $.ajaxSetup({
            'beforeSend': function (xhr) {
                var token = localStorage.getItem('userToken');
                console.log("sending request with token: " + token);
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        });
    },
    showUserAuthenticationDetails: function (profile) {
        var showAuthenticationElements = !!profile; //coerce into a boolean (!!1 evalutes to true, !!0 evalutes to false)
        if (showAuthenticationElements) {
            this.uiElements.profileNameLabel.text(profile.nickname);
            this.uiElements.profileImage.attr('src', profile.picture);
        }
        this.uiElements.loginButton.toggle(!showAuthenticationElements);
        this.uiElements.logoutButton.toggle(showAuthenticationElements);
        this.uiElements.profileButton.toggle(showAuthenticationElements);
    },
    wireEvents: function () {
        var that = this;
        this.uiElements.loginButton.click(function (e) {
            that.data.auth0Lock.show();
        });
        this.uiElements.logoutButton.click(function (e) {
            localStorage.removeItem('userToken');
            that.uiElements.logoutButton.hide();
            that.uiElements.profileButton.hide();
            that.uiElements.loginButton.show();
            for (var i = 0; i < that.eventHandlers.length; i++) {
                that.eventHandlers[i].onLogout();
            }
        });
        this.uiElements.profileButton.click(function (e) {
            var url = that.data.config.apiBaseUrl + '/user-profile';
            $.get(url, function (data, status) {
                $('#user-profile-raw-json').text(JSON.stringify(data, null, 2));
                $('#user-profile-modal').modal();
            })
        });
    }
}
