var $copy = $("#callback .copy");
var $editable = $("#editable");

var flickr = $.flickr();
var $url = $("#callback input");
var $image = $("#editable img");

var uploadStatusHandle = (function () {
    var __status = "OK";

    var op = {
        "reset": function () {
            __status = ''; // 出现异常可以重置！
            uploadStatusHandle.update();
        },
        "update": function () {
            switch (__status) {
                case "OK":
                    $editable.poshytip('update', "正在上传...");
                    __status = "UP";
                    break;
                case "UP":
                    $editable.poshytip('update', "上传完成！点击复制按钮拷贝链接！");
                    __status = "F";
                    setTimeout(uploadStatusHandle.update, 1000);
                    break;
                default:
                    $editable.poshytip('update', "把图片粘贴到这里.");
                    __status = "OK";
            }
            $editable.poshytip('show');
        }
    }

    return op;

})();

function bindClipboardCopy() {
    // @see http://www.steamdev.com/zclip/ 需要服务端才能正常运行
    $copy.zclip({
            path: 'lib/ref/ZeroClipboard.swf',
            copy: function () {
                return $url.val();
            },
            afterCopy: function () {
                // 覆盖默认行为， 默认会弹个框
                showCopyTip("已复制.")
            }
        }
    );

    $copy.poshytip({
        content: '',
        className: 'tip-green',
        /* allowTipHover: false, */
        showOn: 'none',
        alignTo: 'target',
        alignX: 'inner-left',
        offsetX: 5,
        offsetY: 5
    });

    // http://vadikom.com/demos/poshytip/
    $copy.mouseover(function () {
        showCopyTip('复制链接.');
    });
    $copy.mouseout(function () {
        $copy.poshytip('hideDelayed', 200);
    });

    // 显示的内容为元素的title
    $editable.poshytip({
        className: 'tip-green',
        offsetX: -5,
        offsetY: 20,
        followCursor: true,
        slide: false
    });
}

function showCopyTip(mesg) {
    $copy.poshytip('update', mesg);
    $copy.poshytip('show');
}

$(document).ready(function () {

    bindClipboardCopy();

    function updateStaticImage(photoid) {
        flickr.photo(
            photoid,
            function (url) {
                updateImagePath(url);
            }
        );
    }

    function updateImagePath(url) {
        $url.val(url);
    }

    function upload(blob) {
        $editable.addClass("disabled");
        $image.attr('src', '#');

        flickr.upload(
            blob,
            {
                "before": function () {
                    uploadStatusHandle.update();

                    window.URL = window.URL || window.webkitURL;
                    var blobUrl = window.URL.createObjectURL(blob);

                    $image.attr('src', blobUrl);
                    updateImagePath("");
                },
                "finish": function (photoid) {
                    uploadStatusHandle.update();

                    updateStaticImage(photoid);
                    $editable.removeClass("disable");
                }
            }
        );
    }

    $editable.on("paste", function () {
        var ele = event.clipboardData.items;
        if (ele) {
            var hasImg = false;
            for (var i = 0; i < ele.length; ++i) {
                if (ele[i].kind == 'file' && ele[i].type.indexOf('image/') !== -1) {
                    hasImg = true;
                    upload(ele[i].getAsFile());
                }
            }
            if (!hasImg) {
                alert("哥，粘的不是图片吖 ~.~ !-- =!=");
            }
        } else {
            console.log("剪贴板没有数据！");
        }

        // 阻止默认行为
        event.preventDefault();
    });

    $editable.on("dragover", function () {
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    });

    $editable.on("drop", function () {
        event.stopPropagation();
        event.preventDefault();

        var files = event.dataTransfer.files;

        for (var index in files) {
            var f = files[index];
            // 只处理图片
            if (!f.type || !f.type.match('image.*')) {
                continue;
            }
            var blob = f.slice();
            blob.type = f.type;
            upload(blob);
        }
    });

});