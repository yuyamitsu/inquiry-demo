const storageKey = 'inquiries';

/**
 * localStorageから問い合わせ一覧を取得する
 */
function getInquiries() {
  const inquiriesJson = localStorage.getItem(storageKey);

  if (!inquiriesJson) {
    return [];
  }

  try {
    return JSON.parse(inquiriesJson);
  } catch (error) {
    console.error('問い合わせデータの読み込みに失敗しました。', error);
    return [];
  }
}

/**
 * 問い合わせ一覧をlocalStorageに保存する
 */
function saveInquiries(inquiries) {
  localStorage.setItem(storageKey, JSON.stringify(inquiries));
}

/**
 * 現在日時を yyyy/mm/dd hh:mm 形式で取得する
 */
function getCurrentDateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

/**
 * ステータスに応じたCSSクラスを返す
 */
function getStatusClass(status) {
  if (status === '未対応') {
    return 'statusNew';
  }

  if (status === '対応中') {
    return 'statusProgress';
  }

  if (status === '回答済み') {
    return 'statusAnswered';
  }

  if (status === 'クローズ') {
    return 'statusClosed';
  }

  return '';
}

/**
 * HTMLとして解釈されないように文字をエスケープする
 */
function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/**
 * 現在のページがpagesフォルダ配下か判定する
 */
function isPagesDirectory() {
  return window.location.pathname.includes('/pages/');
}

/**
 * 管理者一覧画面へのパスを取得する
 */
function getAdminListPath() {
  if (isPagesDirectory()) {
    return 'admin-list.html';
  }

  return 'pages/admin-list.html';
}

/**
 * 問い合わせフォームへのパスを取得する
 */
function getIndexPath() {
  if (isPagesDirectory()) {
    return '../index.html';
  }

  return 'index.html';
}

/**
 * URLから問い合わせIDを取得する
 */
function getInquiryIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return Number(urlParams.get('id'));
}

/**
 * 問い合わせフォーム画面
 * index.html
 */
const inquiryForm = document.getElementById('inquiryForm');

if (inquiryForm) {
  inquiryForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value;
    const body = document.getElementById('body').value.trim();

    if (!name || !email || !title || !body) {
      alert('未入力の項目があります。');
      return;
    }

    const inquiries = getInquiries();

    const newInquiry = {
      id: Date.now(),
      name: name,
      email: email,
      title: title,
      category: category,
      body: body,
      status: '未対応',
      adminReply: '',
      createdAt: getCurrentDateTime(),
      updatedAt: getCurrentDateTime(),
    };

    inquiries.push(newInquiry);
    saveInquiries(inquiries);

    alert('お問い合わせを登録しました。');
    window.location.href = getAdminListPath();
  });
}

/**
 * 管理者一覧画面
 * pages/admin-list.html
 */
const inquiryTableBody = document.getElementById('inquiryTableBody');

if (inquiryTableBody) {
  displayInquiryList();

  const searchButton = document.getElementById('searchButton');
  const resetButton = document.getElementById('resetButton');
  const addSampleButton = document.getElementById('addSampleButton');
  const clearAllButton = document.getElementById('clearAllButton');

  if (searchButton) {
    searchButton.addEventListener('click', function () {
      displayInquiryList();
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', function () {
      document.getElementById('keyword').value = '';
      document.getElementById('statusFilter').value = '';
      document.getElementById('categoryFilter').value = '';

      displayInquiryList();
    });
  }

  if (addSampleButton) {
    addSampleButton.addEventListener('click', function () {
      addSampleInquiries();
    });
  }

  if (clearAllButton) {
    clearAllButton.addEventListener('click', function () {
      clearAllInquiries();
    });
  }
}

/**
 * 問い合わせ一覧を表示する
 */
function displayInquiryList() {
  const inquiries = getInquiries();

  const keyword = document.getElementById('keyword').value.trim();
  const statusFilter = document.getElementById('statusFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;

  inquiryTableBody.innerHTML = '';

  updateSummary(inquiries);

  const filteredInquiries = inquiries.filter(function (inquiry) {
    const isKeywordMatch =
      keyword === '' ||
      inquiry.title.includes(keyword) ||
      inquiry.name.includes(keyword) ||
      inquiry.email.includes(keyword) ||
      inquiry.body.includes(keyword);

    const isStatusMatch =
      statusFilter === '' || inquiry.status === statusFilter;

    const isCategoryMatch =
      categoryFilter === '' || inquiry.category === categoryFilter;

    return isKeywordMatch && isStatusMatch && isCategoryMatch;
  });

  const resultText = document.getElementById('resultText');

  if (resultText) {
    resultText.textContent = `検索結果：${filteredInquiries.length}件`;
  }

  if (filteredInquiries.length === 0) {
    inquiryTableBody.innerHTML = `
      <tr>
        <td colspan="8">問い合わせはありません。</td>
      </tr>
    `;
    return;
  }

  filteredInquiries.forEach(function (inquiry) {
    const statusClass = getStatusClass(inquiry.status);

    const row = `
      <tr>
        <td>${escapeHtml(inquiry.id)}</td>
        <td>${escapeHtml(inquiry.title)}</td>
        <td>${escapeHtml(inquiry.name)}</td>
        <td>${escapeHtml(inquiry.category)}</td>
        <td>
          <span class="status ${statusClass}">
            ${escapeHtml(inquiry.status)}
          </span>
        </td>
        <td>${escapeHtml(inquiry.createdAt)}</td>
        <td>
          <a href="admin-detail.html?id=${inquiry.id}">詳細</a>
        </td>
        <td>
          <button class="deleteButton" type="button" onclick="deleteInquiry(${inquiry.id})">
            削除
          </button>
        </td>
      </tr>
    `;

    inquiryTableBody.insertAdjacentHTML('beforeend', row);
  });
}

/**
 * 件数サマリーを更新する
 */
function updateSummary(inquiries) {
  const totalCount = inquiries.length;

  const newCount = inquiries.filter(function (inquiry) {
    return inquiry.status === '未対応';
  }).length;

  const progressCount = inquiries.filter(function (inquiry) {
    return inquiry.status === '対応中';
  }).length;

  const answeredCount = inquiries.filter(function (inquiry) {
    return inquiry.status === '回答済み';
  }).length;

  const totalCountElement = document.getElementById('totalCount');
  const newCountElement = document.getElementById('newCount');
  const progressCountElement = document.getElementById('progressCount');
  const answeredCountElement = document.getElementById('answeredCount');

  if (totalCountElement) {
    totalCountElement.textContent = totalCount;
  }

  if (newCountElement) {
    newCountElement.textContent = newCount;
  }

  if (progressCountElement) {
    progressCountElement.textContent = progressCount;
  }

  if (answeredCountElement) {
    answeredCountElement.textContent = answeredCount;
  }
}

/**
 * 問い合わせを削除する
 */
function deleteInquiry(id) {
  const isConfirmed = confirm('この問い合わせを削除しますか？');

  if (!isConfirmed) {
    return;
  }

  const inquiries = getInquiries();

  const updatedInquiries = inquiries.filter(function (inquiry) {
    return inquiry.id !== id;
  });

  saveInquiries(updatedInquiries);
  displayInquiryList();
}

/**
 * サンプルデータを追加する
 */
function addSampleInquiries() {
  const isConfirmed = confirm('サンプルデータを追加しますか？');

  if (!isConfirmed) {
    return;
  }

  const inquiries = getInquiries();
  const now = getCurrentDateTime();

  const sampleInquiries = [
    {
      id: Date.now() + 1,
      name: '山田 太郎',
      email: 'yamada@example.com',
      title: '料金プランについて知りたい',
      category: '質問',
      body: 'サービスの料金プランについて詳しく教えてください。',
      status: '未対応',
      adminReply: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: Date.now() + 2,
      name: '佐藤 花子',
      email: 'sato@example.com',
      title: '管理画面にログインできません',
      category: '不具合',
      body: '昨日から管理画面にログインできない状態です。確認をお願いします。',
      status: '対応中',
      adminReply: '現在、原因を確認しています。',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: Date.now() + 3,
      name: '田中 一郎',
      email: 'tanaka@example.com',
      title: '導入について相談したい',
      category: '相談',
      body: '社内システムの導入について、一度相談したいです。',
      status: '回答済み',
      adminReply: 'お問い合わせありがとうございます。担当者よりご連絡いたします。',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: Date.now() + 4,
      name: '鈴木 次郎',
      email: 'suzuki@example.com',
      title: '請求書の内容について',
      category: '質問',
      body: '請求書の明細について確認したい項目があります。',
      status: '未対応',
      adminReply: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: Date.now() + 5,
      name: '高橋 美咲',
      email: 'takahashi@example.com',
      title: '画面表示が崩れています',
      category: '不具合',
      body: 'スマートフォンで確認した際に、一覧画面の表示が崩れているように見えます。',
      status: 'クローズ',
      adminReply: '修正対応が完了しました。',
      createdAt: now,
      updatedAt: now,
    },
  ];

  saveInquiries([...inquiries, ...sampleInquiries]);

  alert('サンプルデータを追加しました。');
  displayInquiryList();
}

/**
 * 全問い合わせデータを削除する
 */
function clearAllInquiries() {
  const isConfirmed = confirm('すべての問い合わせデータを削除しますか？');

  if (!isConfirmed) {
    return;
  }

  saveInquiries([]);

  alert('すべての問い合わせデータを削除しました。');
  displayInquiryList();
}

/**
 * 管理者詳細画面
 * pages/admin-detail.html
 */
const saveDetailButton = document.getElementById('saveDetailButton');

if (saveDetailButton) {
  displayInquiryDetail();

  saveDetailButton.addEventListener('click', function () {
    updateInquiryDetail();
  });
}

/**
 * 問い合わせ詳細を表示する
 */
function displayInquiryDetail() {
  const inquiryId = getInquiryIdFromUrl();
  const inquiries = getInquiries();

  const inquiry = inquiries.find(function (item) {
    return item.id === inquiryId;
  });

  if (!inquiry) {
    alert('問い合わせが見つかりません。');
    window.location.href = getAdminListPath();
    return;
  }

  document.getElementById('detailId').textContent = inquiry.id;
  document.getElementById('detailName').textContent = inquiry.name;
  document.getElementById('detailEmail').textContent = inquiry.email;
  document.getElementById('detailTitle').textContent = inquiry.title;
  document.getElementById('detailCategory').textContent = inquiry.category;
  document.getElementById('detailBody').textContent = inquiry.body;
  document.getElementById('detailCreatedAt').textContent = inquiry.createdAt;

  document.getElementById('detailStatus').value = inquiry.status;
  document.getElementById('adminReply').value = inquiry.adminReply;
}

/**
 * 問い合わせ詳細を更新する
 */
function updateInquiryDetail() {
  const inquiryId = getInquiryIdFromUrl();
  const inquiries = getInquiries();

  const updatedInquiries = inquiries.map(function (inquiry) {
    if (inquiry.id === inquiryId) {
      return {
        ...inquiry,
        status: document.getElementById('detailStatus').value,
        adminReply: document.getElementById('adminReply').value.trim(),
        updatedAt: getCurrentDateTime(),
      };
    }

    return inquiry;
  });

  saveInquiries(updatedInquiries);

  alert('問い合わせ情報を保存しました。');
  window.location.href = getAdminListPath();
}