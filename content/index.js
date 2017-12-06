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

  function getSite() {
    return document.location.host.split('.')[0];
  }

  function hasSite(site) {
    return [
      'www', 'ask', 'metatalk', 'fanfare',
      'projects', 'music'
    ].includes(site);
  }

  function getPrefix(site) {
    return {
      www: 1, ask: 3, metatalk: 5, fanfare: 2, projects: 7, music: 8
    }[site];
  }

  function init() {
    const site = getSite();
    if (hasSite(site)) {
      const localStorageKeys = getLocalStorageKeys();
      const { posts, postIds } = getPostsAndIds(site);
      const missingPostIds = getMissingPostIds(postIds);
      insertMissingPosts(posts, missingPostIds, localStorageKeys, site);
    }
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

  function createTemporaryElement() {
    const tempEl = create('div');
    tempEl.classList.add('deletedpost', 'copy');
    return tempEl;
  }

  function insertMissingPosts(posts, missingPostIds, localStorageKeys, site) {
    missingPostIds.forEach(function (id) {
      const prev = qs(`[data-postid="${id - 1}"]`);
      const tempEl = createTemporaryElement();
      if (localStorageKeys.includes(id)) {
        tempEl.innerHTML = fetchLocal(id);
      } else {
        getDeletedPostHTML(id, site)
          .then(data => data.text())
          .then((html) => {
            const { post, reason } = getContent(html);
            tempEl.innerHTML = insertLink(id, post, site);
            tempEl.appendChild(getReason(reason));
            saveLocal(id, tempEl.innerHTML);
          });
      }
      insertAfter(tempEl, prev);
      padDeletedPost(tempEl);
    });
  }

  function insertLink(id, el, site) {
    const commentsRe = /\d+ comments total/;
    return el.innerHTML.replace(commentsRe, function (match) {
      return `<a href="https://${site}.metafilter.com/${id}/">${match}</a>`;
    });
  }

  function getReason(el) {
    const tempEl = create('div');
    tempEl.innerHTML = el.innerHTML;
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

  function getDeletedPostHTML(id, site) {
    return fetch(`https://${site}.metafilter.com/${id}/`);
  }

  function getPostsAndIds(site) {
    const postIds = [];
    const posts = getPosts();
    posts.forEach(function (post) {
      const postId = getPostId(post, site);
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

  function getPostId(post, site) {
    const prefix = getPrefix(site);
    const favSpan = qs(`span[id^=fav${prefix}]`, post);
    const regex = new RegExp(`fav${prefix}(\\d+)`);
    return +favSpan.id.match(regex)[1];
  }

}());
