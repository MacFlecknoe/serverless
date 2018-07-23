var videoController = {
    data: {
        config: null
    },
    uiElements: {
        videoCardTemplate: null,
        videoList: null,
        loadingIndicator: null
    },
    init: function (config) {
        this.uiElements.videoCardTemplate = $('#video-template');
        this.uiElements.videoList = $('#video-list');
        this.data.config = config;
    },
    getVideoList: function () {
        var that = this;
        var url = this.data.config.apiBaseUrl + '/videos';
        $.get(url, function (data, status) {
            that.updateVideoFrontPage(data);
        });
    },
    removeVideoList: function () {
        $(".video-file").remove();
    },
    updateVideoFrontPage: function (data) {
        var baseUrl = data.domain;
        var bucket = data.bucket;
        for (var i = 0; i < data.files.length; i++) {
            var video = data.files[i];
            var clone = this.uiElements.videoCardTemplate.clone().attr('id', 'video-' + i);
            clone.show();
            clone.find('source').attr('src', video.filename);
            clone.attr('class', 'row video-file');
            this.uiElements.videoList.prepend(clone);
        }
    },
    onLogin: function () {
        this.getVideoList();
    },
    onLogout: function () {
        this.removeVideoList();
    }
}