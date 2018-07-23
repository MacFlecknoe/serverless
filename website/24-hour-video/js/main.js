(function () {
    $(document).ready(function () {
        videoController.init(configConstants);
        uploadController.init(configConstants);
        userController.init(configConstants, [videoController, uploadController]);
    });
}());
 