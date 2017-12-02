(function () {

  function create(el) {
    return document.createElement(el);
  }

  function qs(selector, context = document) {
    return context.querySelector(selector);
  }

  function qsa(selector, context = document) {
    return context.querySelectorAll(selector);
  }

  function insertBefore(newNode, refNode) {
    refNode.parentNode.insertBefore(newNode, refNode);
  }

  function insertAfter(newNode, refNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling);
  }

  function init() {
    const localStorageKeys = getLocalStorageKeys();
    const { posts, postIds } = getPostsAndIds();
    const missingPostIds = getMissingPostIds(postIds);
    insertMissingPosts(posts, missingPostIds, localStorageKeys);
  }

  init();

  function saveLocal(id, data) {
    localStorage.setItem(id, data);
  }

  function getLocalStorageKeys() {
    return Object.keys(localStorage).map(Number);
  }

  function fetchLocal(id) {
    return localStorage.getItem(id);
  }

  function insertMissingPosts(posts, missingPostIds, localStorageKeys) {
    missingPostIds.forEach(function (id) {
      const prev = qs(`[data-postid="${id - 1}"]`);
      if (localStorageKeys.includes(id)) {
        const tempEl = create('div');
        tempEl.classList.add('deletedpost', 'copy');
        tempEl.innerHTML = fetchLocal(id);
        insertAfter(tempEl, prev);
        padDeletedPost(tempEl);
      } else {
        getDeletedPostHTML(id)
          .then(data => data.text())
          .then((html) => {
            const { post, reason } = getContent(html);
            const tempEl = create('div');
            tempEl.classList.add('deletedpost', 'copy');
            tempEl.innerHTML = insertLink(id, post);
            tempEl.appendChild(getReason(reason));
            insertAfter(tempEl, prev);
            padDeletedPost(tempEl);
            saveLocal(id, tempEl.innerHTML);
          });
      }
    });
  }

  function insertLink(id, el) {
    const commentsRe = /\d+ comments total/;
    return el.innerHTML.replace(commentsRe, function (match) {
      return `<a href="https://www.metafilter.com/${id}/">${match}</a>`;
    });
  }

  function getReason(el) {
    const tempEl = create('div');
    tempEl.innerHTML = el.textContent;
    tempEl.classList.add('deletedreason');
    return tempEl;
  }

  function padDeletedPost(el) {
    insertBefore(create('br'), el);
    insertAfter(create('br'), el);
  }

  function getContent(html) {
    const tempEl = create('div');
    tempEl.innerHTML = html;
    return { post: qs('.copy', tempEl), reason: qs('.reason', tempEl) };
  }

  function getDeletedPostHTML(id) {
    return fetch(`https://www.metafilter.com/${id}/`);
  }

  function getPostsAndIds() {
    const postIds = [];
    const posts = getPosts();
    posts.forEach(function (post) {
      const postId = getPostId(post);
      post.setAttribute('data-postid', postId);
      postIds.push(postId);
    });
    return { posts, postIds };
  }

  function getMissingPostIds(postIds) {
    const revPostIds = postIds.reverse();
    const out = [];
    for (let i = 1; i < revPostIds.length; i++) {
      if (revPostIds[i] - revPostIds[i - 1] !== 1) {
        out.push(revPostIds[i - 1] + 1);
        revPostIds.splice(i, 0, revPostIds[i - 1] + 1);
        i--;
      }
    }
    return out;
  }

  function getPosts() {
    return qsa('.post');
  }

  function getPostId(post) {
    const favSpan = qs('span[id^=fav]', post);
    return +favSpan.id.match(/fav1(\d+)/)[1];
  }

}());
