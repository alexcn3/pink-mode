/**
 * Main File for Popup options
 * @version 1.0
 * @package Dark Night Mode
 */
var warning_en  = false,
    dnm_options = {
    /**
     * Save option data
     *
     * @return void
     */
    save_option_data: function(data) {
        chrome.storage.local.set(data);
    },
    /**
     * Suggestions box object
     *
     *
     */
    suggestions_text: {
        'chrome.google.com' :'Dark Mode will not work in this page because Google Chrome do not allow extensions to modify certain pages due to security reasons.',
        'settings'          :'Dark Mode will not work in this page because Google Chrome do not allow extensions to modify certain pages due to security reasons.',
        'extensions'        :'Dark Mode will not work in this page because Google Chrome do not allow extensions to modify certain pages due to security reasons.',
        'newtab'            :'Dark Mode will not work in this page because Google Chrome do not allow extensions to modify certain pages due to security reasons.',   
        'duckduckgo.com'    :'You can change your theme in the DuckDuckGo settings to see which combination of theme and pink mode fits your browser best.',
    },
    
    hostname: function (url) {
        url = url.replace("www.", '');
        var s = url.indexOf("//") + 2;
        if (s > 1) {
            var o = url.indexOf('/', s);
            if (o > 0) {
                return url.substring(s, o);
            } else {
                o = url.indexOf('?', s);
                if (o > 0) {
                    return url.substring(s, o);
                } else {
                    return url.substring(s);
                }
            }
        } else {
            return url;
        }
    },
    /**
     * Show highbrighness warning
     * @param {int} value. The value of slider
     *
     * @return void
     */
    show_hb_warning: function (value) {
        if (value > 79 && warning_en === false) {
            $('#dnm-brightness-warning').slideDown(400);
            warning_en = true;
        } else if (value < 80 && warning_en === true) {
            $('#dnm-brightness-warning').slideUp(400);
            warning_en = false;
        }
    },
    /**
     * Set slider status text
     * @param {int} position. Slider value
     * @param {object} $sbox. The status box jQUery elemement
     *
     * @return void
     */
    set_slider_status_text: function(position,$sbox) {
        if (position > 60) {
            status_sv   = Math.round(((position - parseInt(40))/parseInt(60)) * 100);
            status_text = status_sv + '% brighter';
            this.show_hb_warning(status_sv);
        } else if (position < 50) {
            status_sv   = Math.round(((parseInt(61) - position)/parseInt(50)) * 100);
            status_text = status_sv + '% darker';
        } else {
            status_sv   = 55;
            status_text = 'Default Brightness';
        }
        $sbox.text(status_text);
    },
    /**
     * Get option data
     *
     * @return {string} Get option data
     */
    set_option_data_onload: function() {
        chrome.storage.local.get({'mode_status':'on','document_brightness': 55,'whitelist':{},'lock_brightness':'off'},function (data) {
            var mode_status = document.getElementsByName("mode_status");
            if (data.mode_status == 'off') {
                mode_status[0].checked = true;
            } else if (data.mode_status == 'auto') {
                mode_status[1].checked = true;
                $('#intro-text-div').slideDown();
            } else if (data.mode_status == 'on') {
                mode_status[2].checked = true;
            }
            var slider      = document.querySelectorAll('input[type="range"]'),
                $sbox       = $('#dnm-status-slider-update'),
                status_text = '',
                status_sv   = '';
            rangeSlider.create(slider, {
                onInit: function () {
                    this.update({value :data.document_brightness}, true);
                    dnm_options.set_slider_status_text(data.document_brightness,$sbox);
                },
                onSlide: function (position, value) {
                    dnm_options.set_slider_status_text(position,$sbox);
                },
                onSlideEnd: function (position, value) {
                    dnm_options.save_option_data({'document_brightness':position});
                }
            });
            var $white_list_btn = $('#dmn-whitelist-checkbox');
            chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
                var url         = tabs[0].url;
                    sitename    = dnm_options.hostname(url);
                if (sitename in data.whitelist) {
                    $white_list_btn.prop('checked',true);
                }
                var $site_name_ele  = $('#dnm-website-text');
                $site_name_ele.text(sitename);
                if (sitename in dnm_options.suggestions_text) {
                    setTimeout(() => {
                        var $sug_box    = $('.dma-suggestion'),
                            $sug_text   = $sug_box.find('#dma-suggestions-text-content');
                        if (! $sug_box.is(':visible')) {
                            $sug_text.text(dnm_options.suggestions_text[sitename]);
                            $sug_box.slideDown();
                        }
                    },600);
                }
            });
            var $lock_brightness_btn = $('#dnm-brightness-status');
            if (data.lock_brightness == 'on') {
                $lock_brightness_btn.addClass('dnm-b-locked');
            }
        });
    }
}
window.onload = function () {
    dnm_options.set_option_data_onload();
}
jQuery(document).ready(function($) {
    var curr_value  = '',
        itdiv       = $('#intro-text-div');

    $('body').on('change', '.mode-status-radio', function(event) {
        curr_value = $(this).filter(':checked').val();
        dnm_options.save_option_data({'mode_status':curr_value});
        if (curr_value == 'auto') {
            if (! itdiv.is(':visible')) {
                itdiv.slideDown();
            }
        } else {
            if (itdiv.is(':visible')) {
                itdiv.slideUp();
            }
        }
    });
    var $this       = '',
        sitename    = '',
        is_in       = false,
        list_all    = '';
    $('body').on('change', '#dmn-whitelist-checkbox', function(event) {
        $this = $(this);
        chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
            var url         = tabs[0].url;
                sitename    = dnm_options.hostname(url);
            chrome.storage.local.get({'whitelist':{}},function(data) {
                list_all = data.whitelist;
                if (sitename in list_all) {
                    is_in = true;
                }
                if ($this.is(':checked')) {
                    list_all[sitename] = true;
                } else {
                    if (is_in === true) {
                        delete list_all[sitename];
                    }
                }
                dnm_options.save_option_data({'whitelist':list_all});
            });
        });
    });
    $('body').on('click', '#dnm-brightness-status', function(event) {
        $(this).toggleClass('dnm-b-locked');
        var value = 'off';
        if ($(this).hasClass('dnm-b-locked')) {
            value = 'on';
        }
        dnm_options.save_option_data({'lock_brightness':value});
    });
});
