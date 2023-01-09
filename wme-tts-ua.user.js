// ==UserScript==
// @name         WME TTS UA
// @description  Check TTS speech for the streets in Ukraine
// @namespace    https://github.com/waze-ua/wme-tts-ua
// @grant        none
// @version      2023.01.09.001
// @author       Vinkoy, turbopirate, madnut
// @match        https://*.waze.com/editor*
// @match        https://*.waze.com/*/editor*
// @exclude      https://*.waze.com/user/editor*
// @updateURL    https://github.com/waze-ua/wme-tts-ua/raw/master/wme-tts-ua.user.js
// @downloadURL  https://github.com/waze-ua/wme-tts-ua/raw/master/wme-tts-ua.user.js
// @require      https://greasyfork.org/scripts/450160-wme-bootstrap/code/WME-Bootstrap.js
// ==/UserScript==

/* jshint -W033 */
/* jshint esversion: 8 */

/* global W */
/* global $ */

console.warn('Remove this line, when WME-Bootstrap will fix its syntax. now it causes script error on load, details https://stackoverflow.com/questions/42036349/uncaught-typeerror-intermediate-value-is-not-a-function');

(function () {
    'use strict';

    var script_id = "WME-TTS-UA";
    var minutes_value = 20;
    var round_exit_value = 1;

    function TTStest_bootstrap() {
        $(document)
        .on('bootstrap.wme', function () {
            console.log("WME TTS UA: Ready to work!");
            $(document)
                .on('segment.wme', (event, element, model) => {
                    addBtns();
                });
            $(document)
                .on('venue.wme', (event, element, model) => {
                    addBtns();
                });
            TTStest_initBindKey();
        });
    }

    function addBtns() {

        let selectedItems = W.selectionManager.getSelectedFeatures();
        if (selectedItems.length === 0)
            return;

        if (!document.getElementById(script_id)) {

            if (!document.querySelector('wz-tab.' + script_id)) {
                var btnSection = document.createElement('div');
                btnSection.id = script_id;

                var panelElement = document.createElement('wz-tab');
                var userTabs = document.getElementById('edit-panel');
                if (!userTabs) {
                    return;
                }

                var navTabs = userTabs.getElementsByTagName('wz-tabs')[0];
                if (navTabs) {
                    panelElement.label = "TTS";
                    panelElement.className = script_id;
                    //panelElement.innerHTML = ;

                    navTabs.appendChild(panelElement);
                } else {
                    btnSection.id = '';
                }

                if (btnSection.id !== '') {
                    btnSection.innerHTML = '<div class="form-group">' +
                        '<wz-label>' + GM_info.script.name + ' v' + GM_info.script.version + '</wz-label>' +
                        '<div class="controls-container">' +
                        '</br>';

                    if (selectedItems[0].model.type === 'segment') {
                        var class_style_turn = 'class="btn btn-default" style="font-size:18px; width:40px; padding:0px; background-color: #4CC600; cursor: pointer;" ';
                        var class_style_keep = 'class="btn btn-default" style="font-size:18px; width:40px; padding:0px; background-color: #CBFF84; cursor: pointer;" ';
                        var class_style_exit = 'class="btn btn-default" style="font-size:18px; width:40px; padding:0px; background-color: #6CB5FF; cursor: pointer;" ';
                        var class_style_roundabout = 'class="btn btn-default" style="font-size:24px; width:40px; padding:0px; cursor: pointer;" ';

                        var street = W.model.streets.getObjectById(selectedItems[0].model.attributes.primaryStreetID);
                        var streetName = street && street.name ? street.name : 'Сегмент без імені';

                        btnSection.innerHTML +=
                        '<button id="wmettsStreet" class="btn btn-default" title="' + streetName + '"><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp;' + streetName + '</button>&nbsp;' +
                        '</br></br>' +
                        '<button id="wmettsContinue" class="btn btn-default" title="Продовжуйте рух близько ' + minutes_value + ' хвилин"><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp;Продовжуйте рух близько</button>&nbsp;' +
                        '</br>' +
                        '<input type="number" id="minutes" value="' + minutes_value + '" style="width: 60px; margin-top: 5px;"/>&nbsp; хвилин' +
                        '</br>' +
                        '<button id="wmettsContStraight" class="btn btn-default" title="Продовжуйте рух прямо до "><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp;Продовжуйте рух прямо до <i>' + streetName + '</i></button>&nbsp;' +
                        '</br>' +
                        '<button id="wmettsUturn" class="btn btn-default" title="Розверніться на ' + streetName + '"><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp; Розверніться на <i>' + streetName + '</i></button>&nbsp;' +
                        '</br>' +
                        '<button id="wmettsGoing" class="btn btn-default" title="поїдемо по ' + streetName + '"><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp; Поїдемо по <i>' + streetName + '</i></button>&nbsp;' +
                        '</br></br>' +
                        '<label class="control-label">Поверніть...</label>' +
                        '<button id="wmettsTL" ' + class_style_turn + ' title="Поверніть ліворуч">←</button>&nbsp;' +
                        '<button id="wmettsTR" ' + class_style_turn + ' title="Поверніть праворуч">→</button>&nbsp;' +
                        '</br></br>' +
                        '<label class="control-label">Тримайтесь...</label>' +
                        '<button id="wmettsKL" ' + class_style_keep + ' title="Тримайтесь лівіше">↖</button>&nbsp;' +
                        '<button id="wmettsKR" ' + class_style_keep + ' title="Тримайтесь правіше">↗</button>&nbsp;' +
                        '</br></br>' +
                        '<label class="control-label">З\'їзд...</label>' +
                        '<button id="wmettsEL" ' + class_style_exit + ' title="З\'їзд ліворуч">↖</button>&nbsp;' +
                        '<button id="wmettsER" ' + class_style_exit + ' title="З\'їзд праворуч">↗</button>&nbsp;' +
                        '</br></br>' +
                        '<label class="control-label">З\'їзд з кільця...</label>' +
                        '<button id="wmettsRND" ' + class_style_roundabout + ' title="На кільці ' + round_exit_value + ' зїзд">☼</button>&nbsp;' +
                        '<input type="number" id="round_exit" value="' + round_exit_value + '" min="1" max="7" style="width: 60px; margin-top: 5px;"/>&nbsp; зїзд';
                    } else if (selectedItems[0].model.type == "venue") {
                        var venueName = selectedItems[0].model.attributes.name;
                        var poiName = venueName !== "" ? venueName : 'ПОІ БЕЗ ІМЕНІ';

                        btnSection.innerHTML +=
                        '<button id="wmettsStreet" class="btn btn-default" title="' + poiName + '"><i class="fa fa-volume-up" style="font-size:16px;"></i>&nbsp;&nbsp;' + poiName + '</button>&nbsp;';
                    }
                    btnSection.innerHTML += '</br></br></div></div>';
                    panelElement.appendChild(btnSection);

                    if (document.getElementById('wmettsStreet'))
                        document.getElementById('wmettsStreet').onclick = playTTS;
                    if (document.getElementById('wmettsContinue'))
                        document.getElementById('wmettsContinue').onclick = playTTS;
                    if (document.getElementById('wmettsContStraight'))
                        document.getElementById('wmettsContStraight').onclick = playTTS;
                    if (document.getElementById('wmettsTL'))
                        document.getElementById('wmettsTL').onclick = playTTS;
                    if (document.getElementById('wmettsTR'))
                        document.getElementById('wmettsTR').onclick = playTTS;
                    if (document.getElementById('wmettsKL'))
                        document.getElementById('wmettsKL').onclick = playTTS;
                    if (document.getElementById('wmettsKR'))
                        document.getElementById('wmettsKR').onclick = playTTS;
                    if (document.getElementById('wmettsEL'))
                        document.getElementById('wmettsEL').onclick = playTTS;
                    if (document.getElementById('wmettsER'))
                        document.getElementById('wmettsER').onclick = playTTS;
                    if (document.getElementById('wmettsUturn'))
                        document.getElementById('wmettsUturn').onclick = playTTS;
                    if (document.getElementById('wmettsGoing'))
                        document.getElementById('wmettsGoing').onclick = playTTS;
                    if (document.getElementById('wmettsRND'))
                        document.getElementById('wmettsRND').onclick = playTTS;
                    if (document.getElementById('minutes'))
                        document.getElementById('minutes').onchange = function () {
                            minutes_value = document.getElementById('minutes').value;
                        };
                    if (document.getElementById('round_exit'))
                        document.getElementById('round_exit').onchange = function () {
                            round_exit_value = document.getElementById('round_exit').value;
                        };
                }
            }
        }

        if (document.getElementById(script_id)) {
            var disabledButton = false;
            var model = selectedItems[0].model;
            var addrAttr = model.getAddress().attributes;

            if ((model.type !== 'segment' ||
                    !(addrAttr.hasOwnProperty('street') && addrAttr.street !== null && addrAttr.street.name !== null)) && (model.type !== 'venue' || model.attributes.name === "")) {
                disabledButton = true;
            }

            var lock = document.getElementById('wmetts_lock');
            if (lock) {

                if (disabledButton) {
                    lock.setAttribute('style', 'color:red;');
                    lock.setAttribute('class', "fa fa-lock");
                } else {
                    lock.setAttribute('style', 'color:green;');
                    lock.setAttribute('class', "fa fa-unlock");
                }
            }

            if (document.getElementById('wmettsStreet'))
                document.getElementById('wmettsStreet').disabled = disabledButton;
            if (document.getElementById('wmettsContinue'))
                document.getElementById('wmettsContinue').disabled = disabledButton;
            if (document.getElementById('wmettsContStraight'))
                document.getElementById('wmettsContStraight').disabled = disabledButton;
            if (document.getElementById('wmettsTL'))
                document.getElementById('wmettsTL').disabled = disabledButton;
            if (document.getElementById('wmettsTR'))
                document.getElementById('wmettsTR').disabled = disabledButton;
            if (document.getElementById('wmettsKL'))
                document.getElementById('wmettsKL').disabled = disabledButton;
            if (document.getElementById('wmettsKR'))
                document.getElementById('wmettsKR').disabled = disabledButton;
            if (document.getElementById('wmettsEL'))
                document.getElementById('wmettsEL').disabled = disabledButton;
            if (document.getElementById('wmettsER'))
                document.getElementById('wmettsER').disabled = disabledButton;
            if (document.getElementById('wmettsUturn'))
                document.getElementById('wmettsUturn').disabled = disabledButton;
            if (document.getElementById('wmettsGoing'))
                document.getElementById('wmettsGoing').disabled = disabledButton;
            if (document.getElementById('wmettsRND'))
                document.getElementById('wmettsRND').disabled = disabledButton;
        }
    }

    function playTTS() {
        let ttsName = '';
        let selectedItems = W.selectionManager.getSelectedFeatures();

        if (selectedItems.length === 0)
            return;

        if (selectedItems[0].model.type === 'segment') {
            if (selectedItems.length != 1) {
                alert('Виберіть тільки один сегмент');
                return;
            }

            var street = W.model.streets.getObjectById(selectedItems[0].model.attributes.primaryStreetID);
            if (typeof street !== "undefined") {
                if (street.name === null) {
                    alert('Сегмент без імені');
                    return;
                } else {
                    ttsName = street.name;
                }
            } else {
                console.log('WME_TTS undefined street');
                return;
            }
        } else if (selectedItems[0].model.type === 'venue') {
            ttsName = selectedItems[0].model.attributes.name;
        }

        var preText = '';
        switch (this.id) {
        case 'wmettsStreet':
            preText = ' ';
            break;
        case 'wmettsContinue':
            preText = 'продовжуйте рух близько ';
            var minutes;
            if (document.getElementById('minutes') !== null)
                minutes = minutes_value + ' хвилин до ';
            else
                minutes = '20 хвилин до ';
            ttsName = minutes + ttsName;
            break;
        case 'wmettsContStraight':
            preText = 'продовжуйте рух прямо до ';
            break;
        case 'wmettsTL':
            preText = 'поверніть ліворуч на ';
            break;
        case 'wmettsTR':
            preText = 'поверніть праворуч на ';
            break;
        case 'wmettsKL':
            preText = 'тримайтесь лівіше до ';
            break;
        case 'wmettsKR':
            preText = 'тримайтесь правіше до ';
            break;
        case 'wmettsEL':
            preText = 'з\'їзд ліворуч до ';
            break;
        case 'wmettsER':
            preText = 'з\'їзд праворуч до ';
            break;
        case 'wmettsUturn':
            preText = 'розверніться на ';
            break;
        case 'wmettsGoing':
            preText = 'поїдемо по ';
            break;
        case 'wmettsRND':
            var round_exit_text;
            switch (round_exit_value) {
            case '1':
                round_exit_text = 'перший';
                break;
            case '2':
                round_exit_text = 'другий';
                break;
            case '3':
                round_exit_text = 'третій';
                break;
            case '4':
                round_exit_text = 'четвертий';
                break;
            case '5':
                round_exit_text = 'п\'ятий';
                break;
            case '6':
                round_exit_text = 'шостий';
                break;
            case '7':
                round_exit_text = 'сьомий';
                break;
            default:
                round_exit_text = 'перший';
            }
            preText = 'на кільці ' + round_exit_text + ' з\'їзд до ';
            break;
        default:
            alert("Unknown error");
        }

        if (ttsName.search(/^> /) != -1) {
            ttsName = ttsName.replace(/^> /, 'у напрямку ');
            preText = preText.replace(/ (до|на|по) /i, ' ');
        }

        if (preText !== '') {
            // Make sure LON & LAT are pointing at your country
            new Audio('https://ttsgw.world.waze.com/TTSGateway/Text2SpeechServlet?text=' + preText + ttsName + '&lang=uk&lon=28.668631&lat=50.264148&version=6&protocol=2&sessionid=12345654321&content_type=audio%2Fmpeg&type=street&validate_data=positive&skipCache=true').play();
        }
    }

    function playTTSHand() {
        if ((typeof arguments[0]) === "object") {
            switch (arguments[0].type) {
            case 'click': // click button
                {
                    var e = document.getElementById(arguments[0].id);
                    if (e)
                        e.click();

                    break;
                }
            }
        }
    }

    function TTStest_initBindKey() {
        var Config = [{
                handler: 'wmettsStreet',
                title: 'Ім\'я сенгмента/ПОІ',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsStreet'
                }
            }, {
                handler: 'wmettsContinue',
                title: 'Продовжуйте рух',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsContinue'
                }
            }, {
                handler: 'wmettsContStraight',
                title: 'Продовжуйте рух',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsContStraight'
                }
            }, {
                handler: 'wmettsTL',
                title: 'Поверніть ліворуч на',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsTL'
                }
            }, {
                handler: 'wmettsTR',
                title: 'Поверніть праворуч на',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsTR'
                }
            }, {
                handler: 'wmettsKL',
                title: 'Тримайтесь лівіше до',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsKL'
                }
            }, {
                handler: 'wmettsKR',
                title: 'Тримайтесь правіше до',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsKR'
                }
            }, {
                handler: 'wmettsEL',
                title: 'З\'їзд ліворуч до',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsEL'
                }
            }, {
                handler: 'wmettsER',
                title: 'З\'їзд праворуч до',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsER'
                }
            }, {
                handler: 'wmettsUturn',
                title: 'Розверніться на',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsUturn'
                }
            }, {
                handler: 'wmettsGoing',
                title: 'Поїдемо по',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsGoing'
                }
            }, {
                handler: 'wmettsRND',
                title: 'На кільці перший з\'їзд до',
                func: playTTSHand,
                key: -1,
                arg: {
                    type: 'click',
                    id: 'wmettsRND'
                }
            },
        ];

        for (var i = 0; i < Config.length; ++i) {
            WMEKSRegisterKeyboardShortcut('WME TTS UA', 'WME TTS UA', Config[i].handler, Config[i].title, Config[i].func, Config[i].key, Config[i].arg);
        }

        WMEKSLoadKeyboardShortcuts('WME TTS UA');

        window.addEventListener("beforeunload", function () {
            WMEKSSaveKeyboardShortcuts('WME TTS UA');
        }, false);
    }

    TTStest_bootstrap();

    // ------------------------------

    // from: https://greasyfork.org/ru/scripts/16071-wme-keyboard-shortcuts (modify)
    /*
    when adding shortcuts each shortcut will need a uniuque name
    the command to add links is WMERegisterKeyboardShortcut(ScriptName, ShortcutsHeader, NewShortcut, ShortcutDescription, FunctionToCall, ShortcutKeysObj) {
    ScriptName: This is the name of your script used to track all of your shortcuts on load and save.
    ScriptName: replace 'WMEAwesome' with your scripts name such as 'SomeOtherScript'
    ShortcutsHeader: this is the header that will show up in the keyboard editor
    NewShortcut: This is the name of the shortcut and needs to be uniuque from all of the other shortcuts, from other scripts, and WME
    ShortcutDescription: This wil show up as the text next to your shortcut
    FunctionToCall: this is the name of your function that will be called when the keyboard shortcut is presses
    ShortcutKeysObj: the is the object representing the keys watched set this to '-1' to let the users specify their own shortcuts.
    ShortcutKeysObj: The alt, shift, and ctrl keys are A=alt, S=shift, C=ctrl. for short cut to use "alt shift ctrl and l" the object would be 'ASC+l'
     */
    function WMEKSRegisterKeyboardShortcut(e, r, t, a, o, s, c) {
        try {
            I18n.translations[I18n.locale].keyboard_shortcuts.groups[e].members.length
        } catch (n) {
            W.accelerators.Groups[e] = [],
            W.accelerators.Groups[e].members = [],
            I18n.translations[I18n.locale].keyboard_shortcuts.groups[e] = [],
            I18n.translations[I18n.locale].keyboard_shortcuts.groups[e].description = r,
            I18n.translations[I18n.locale].keyboard_shortcuts.groups[e].members = []
        }
        if (o && "function" == typeof o) {
            I18n.translations[I18n.locale].keyboard_shortcuts.groups[e].members[t] = a,
            W.accelerators.addAction(t, {
                group: e
            });
            var l = "-1",
            i = {};
            i[l] = t,
            W.accelerators._registerShortcuts(i),
            null !== s && (i = {}, i[s] = t, W.accelerators._registerShortcuts(i)),
            W.accelerators.events.register(t, null, function () {
                o(c)
            })
        } else
            alert("The function " + o + " has not been declared")
    }
    function WMEKSLoadKeyboardShortcuts(e) {
        if (localStorage[e + "KBS"])
            for (var r = JSON.parse(localStorage[e + "KBS"]), t = 0; t < r.length; t++)
                W.accelerators._registerShortcuts(r[t])
    }
    function WMEKSSaveKeyboardShortcuts(e) {
        var r = [];
        for (var t in W.accelerators.Actions) {
            var a = "";
            if (W.accelerators.Actions[t].group == e) {
                W.accelerators.Actions[t].shortcut ? (W.accelerators.Actions[t].shortcut.altKey === !0 && (a += "A"), W.accelerators.Actions[t].shortcut.shiftKey === !0 && (a += "S"), W.accelerators.Actions[t].shortcut.ctrlKey === !0 && (a += "C"), "" !== a && (a += "+"), W.accelerators.Actions[t].shortcut.keyCode && (a += W.accelerators.Actions[t].shortcut.keyCode)) : a = "-1";
                var o = {};
                o[a] = W.accelerators.Actions[t].id,
                r[r.length] = o
            }
        }
        localStorage[e + "KBS"] = JSON.stringify(r)
    }
    /* ********************************************************** */
})();
