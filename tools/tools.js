// 工具页逻辑：全部在浏览器本地运行，不发送任何数据到服务端。
(function () {
  'use strict';

  var $ = function (id) {
    return document.getElementById(id);
  };

  // state 取值：ok / error / 空（普通提示）
  function setStatus(el, message, state) {
    if (!el) return;
    el.textContent = message;
    if (state) {
      el.setAttribute('data-state', state);
    } else {
      el.removeAttribute('data-state');
    }
  }

  function bind(id, handler) {
    var el = $(id);
    if (el) el.addEventListener('click', handler);
  }

  // 复制按钮：clipboard API 在非安全上下文下不可用，失败时给出提示而不是静默。
  function attachCopy(buttonId, sourceId, statusEl) {
    bind(buttonId, function () {
      var source = $(sourceId);
      if (!source || !source.value) {
        setStatus(statusEl, '没有可复制的内容。', 'error');
        return;
      }
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        source.select();
        setStatus(statusEl, '当前浏览器不支持一键复制，已帮你全选，请手动复制。', 'error');
        return;
      }
      navigator.clipboard.writeText(source.value).then(
        function () {
          setStatus(statusEl, '已复制到剪贴板。', 'ok');
        },
        function () {
          source.select();
          setStatus(statusEl, '复制失败，已帮你全选，请手动复制。', 'error');
        }
      );
    });
  }

  /* ---------- JSON 格式化 ---------- */

  (function initJson() {
    var input = $('json-input');
    var output = $('json-output');
    var status = $('json-status');
    if (!input || !output) return;

    function run(indent) {
      var raw = input.value.trim();
      if (!raw) {
        output.value = '';
        setStatus(status, '请先粘贴一段 JSON。', 'error');
        return;
      }
      try {
        var parsed = JSON.parse(raw);
        output.value = indent ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
        setStatus(status, indent ? 'JSON 有效，已格式化。' : 'JSON 有效，已压缩为单行。', 'ok');
      } catch (err) {
        output.value = '';
        setStatus(status, '解析失败：' + err.message, 'error');
      }
    }

    bind('json-format', function () {
      run(true);
    });
    bind('json-minify', function () {
      run(false);
    });
    bind('json-clear', function () {
      input.value = '';
      output.value = '';
      setStatus(status, '');
    });
    attachCopy('json-copy', 'json-output', status);
  })();

  /* ---------- 编码转换 ---------- */

  // btoa/atob 只处理 Latin-1，中文需要先过一遍 UTF-8 字节。
  function base64Encode(text) {
    var bytes = new TextEncoder().encode(text);
    var binary = '';
    for (var i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function base64Decode(text) {
    var binary = atob(text.replace(/\s+/g, ''));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  (function initCodec() {
    var input = $('codec-input');
    var output = $('codec-output');
    var status = $('codec-status');
    if (!input || !output) return;

    function run(label, transform) {
      var raw = input.value;
      if (!raw.trim()) {
        output.value = '';
        setStatus(status, '请先输入要转换的文本。', 'error');
        return;
      }
      try {
        output.value = transform(raw);
        setStatus(status, label + '完成。', 'ok');
      } catch (err) {
        output.value = '';
        setStatus(status, label + '失败：输入不是合法的' + (label.indexOf('Base64') === 0 ? ' Base64 ' : '编码') + '内容。', 'error');
      }
    }

    bind('codec-b64-encode', function () {
      run('Base64 编码', base64Encode);
    });
    bind('codec-b64-decode', function () {
      run('Base64 解码', base64Decode);
    });
    bind('codec-url-encode', function () {
      run('URL 编码', encodeURIComponent);
    });
    bind('codec-url-decode', function () {
      run('URL 解码', decodeURIComponent);
    });
    bind('codec-swap', function () {
      var tmp = input.value;
      input.value = output.value;
      output.value = tmp;
      setStatus(status, '已把结果放回输入框。');
    });
    bind('codec-clear', function () {
      input.value = '';
      output.value = '';
      setStatus(status, '');
    });
    attachCopy('codec-copy', 'codec-output', status);
  })();

  /* ---------- 正则测试 ---------- */

  (function initRegex() {
    var pattern = $('regex-pattern');
    var flags = $('regex-flags');
    var text = $('regex-text');
    var output = $('regex-output');
    var status = $('regex-status');
    if (!pattern || !text || !output) return;

    // 病态正则可能让浏览器卡死，这里给全局匹配加一个迭代上限。
    var MAX_MATCHES = 2000;

    function run() {
      var source = pattern.value;
      if (!source) {
        output.value = '';
        setStatus(status, '请先输入正则表达式。', 'error');
        return;
      }

      var re;
      try {
        re = new RegExp(source, flags.value);
      } catch (err) {
        output.value = '';
        setStatus(status, '正则无效：' + err.message, 'error');
        return;
      }

      var subject = text.value;
      var lines = [];
      var count = 0;

      if (re.global) {
        var match;
        re.lastIndex = 0;
        while ((match = re.exec(subject)) !== null) {
          lines.push(formatMatch(match, count + 1));
          count += 1;
          // 零宽匹配会让 lastIndex 原地不动，必须手动推进。
          if (match.index === re.lastIndex) re.lastIndex += 1;
          if (count >= MAX_MATCHES) {
            lines.push('… 已达到 ' + MAX_MATCHES + ' 条上限，停止匹配。');
            break;
          }
        }
      } else {
        var single = re.exec(subject);
        if (single) {
          lines.push(formatMatch(single, 1));
          count = 1;
        }
      }

      if (!count) {
        output.value = '';
        setStatus(status, '没有匹配到任何内容。');
        return;
      }

      output.value = lines.join('\n');
      setStatus(status, '共匹配到 ' + count + ' 处' + (re.global ? '' : '（未加 g 标志，只返回第一处）') + '。', 'ok');
    }

    function formatMatch(match, index) {
      var line = '#' + index + '  位置 ' + match.index + '  ' + JSON.stringify(match[0]);
      for (var i = 1; i < match.length; i += 1) {
        line += '\n     分组 ' + i + '：' + (match[i] === undefined ? '(未匹配)' : JSON.stringify(match[i]));
      }
      if (match.groups) {
        Object.keys(match.groups).forEach(function (key) {
          line += '\n     具名分组 ' + key + '：' +
            (match.groups[key] === undefined ? '(未匹配)' : JSON.stringify(match.groups[key]));
        });
      }
      return line;
    }

    bind('regex-run', run);
    bind('regex-clear', function () {
      pattern.value = '';
      text.value = '';
      output.value = '';
      setStatus(status, '');
    });
  })();

  /* ---------- 时间戳转换 ---------- */

  (function initTimestamp() {
    var tsInput = $('ts-input');
    var tsOutput = $('ts-output');
    var dateInput = $('ts-date');
    var dateOutput = $('ts-date-output');
    var status = $('ts-status');
    if (!tsInput || !tsOutput) return;

    function pad(n) {
      return String(n).padStart(2, '0');
    }

    function formatLocal(date) {
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
    }

    bind('ts-to-date', function () {
      var raw = tsInput.value.trim();
      if (!/^\d{1,16}$/.test(raw)) {
        tsOutput.value = '';
        setStatus(status, '请输入纯数字的时间戳（秒或毫秒）。', 'error');
        return;
      }
      // 10 位按秒、13 位按毫秒，这是最常见的两种约定。
      var ms = raw.length <= 10 ? Number(raw) * 1000 : Number(raw);
      var date = new Date(ms);
      if (Number.isNaN(date.getTime())) {
        tsOutput.value = '';
        setStatus(status, '这个时间戳超出了可表示的范围。', 'error');
        return;
      }
      tsOutput.value =
        '本地时间：' + formatLocal(date) + '\n' +
        'ISO 8601：' + date.toISOString() + '\n' +
        'UTC 时间：' + date.toUTCString() + '\n' +
        '秒级：' + Math.floor(ms / 1000) + '\n' +
        '毫秒级：' + ms;
      setStatus(status, '按' + (raw.length <= 10 ? '秒' : '毫秒') + '级时间戳解析完成。', 'ok');
    });

    bind('ts-now', function () {
      tsInput.value = String(Date.now());
      setStatus(status, '已填入当前毫秒级时间戳。');
    });

    bind('ts-to-stamp', function () {
      var raw = dateInput.value;
      if (!raw) {
        dateOutput.value = '';
        setStatus(status, '请先选择一个日期时间。', 'error');
        return;
      }
      var date = new Date(raw);
      if (Number.isNaN(date.getTime())) {
        dateOutput.value = '';
        setStatus(status, '日期时间格式无法识别。', 'error');
        return;
      }
      dateOutput.value = '秒级：' + Math.floor(date.getTime() / 1000) + '\n毫秒级：' + date.getTime();
      setStatus(status, '已按本地时区转换为时间戳。', 'ok');
    });
  })();
})();
