const bookmark_path = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z";
const bookmark_filled = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z";

const bluesky_blue = "hsl(211, 99.1%, 56.1%)";
const default_gray = "hsl(211, 20%, 56%)";

let bookmark_div;
let bookmark_pressed = false;

const MAX_STORAGE_BYTES = 10 * 1024 * 1024;

function getSizeInBytes(object) {
  const jsonStr = JSON.stringify(object);
  return new Blob([jsonStr]).size;
}

function waitForElm(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

function saveData(newBookmark) {
  (browser || chrome).storage.local.get(['bookmarks'], (result) => {
    let updatedArray;
    let currentArray = result['bookmarks'] || [];
    
    if (bookmark_pressed) {
      updatedArray = [...currentArray, newBookmark];
    } else {
      updatedArray = currentArray.filter(bookmark => bookmark[1] !== newBookmark[1]);
    }

    (browser || chrome).storage.local.set({ 'bookmarks': updatedArray }, () => {
      console.log("Bookmarks updated!");
    });
  });
}

async function addBookmark() {
  bookmark_pressed = !bookmark_pressed;

  if (bookmark_pressed) {
    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_filled);
    bookmark_div.firstChild.firstChild.setAttribute("fill", bluesky_blue);
  } else {
    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_path);
    bookmark_div.firstChild.firstChild.setAttribute("fill", default_gray);
  }

  const buttons = document.querySelectorAll('[data-testid="bookmarkBtn"]');
  const button = buttons[Math.min(buttons.length - 1, 6)];
  const media_container = button.parentNode.parentNode.parentNode.firstChild;
  const images = media_container.getElementsByTagName("img");
  const image = images[0];
  const context_container = media_container.parentNode.parentNode.firstChild;

  let pfp_src = context_container.getElementsByTagName("img")[0].src.split("/");
  let did = pfp_src[pfp_src.length - 2].replace("did:plc:", "");
  let cid;

  if (image !== undefined) {
    let image_src = image.src.split("/");
    cid = image_src[7].replace("@jpeg", "");
  } else {
    const video = media_container.getElementsByTagName("video")[0];
    if (video !== undefined) {
      let video_src = video.getAttribute("poster").split("/");
      cid = video_src[video_src.length - 2];
    }
  }

  const url = window.location.href;
  const pid = url.split("/").pop().split("?")[0];

  saveData([did, pid, cid]);
}

async function addButton(event) {
  bookmark_pressed = false;
  const current_url = window.location.href;
  const spliturl = current_url.split("/");

  if (spliturl[spliturl.length - 2] !== "post") return;

  const old_bookmark_buttons = document.querySelectorAll('[data-testid="postBookmarkBtn"]')

  old_bookmark_buttons.forEach(element => {
    element.parentNode.remove()
  });

  const share_buttons = document.querySelectorAll('[data-testid="postShareBtn"]');

  var share_button
  if (share_buttons.length == 0) {
    share_button = await waitForElm('[data-testid="postShareBtn"]')
  }else{
    share_button = share_buttons[share_buttons.length-1]
  }

  const share_div = share_button.parentNode.parentNode.parentNode;
  bookmark_div = share_button.cloneNode(true);
  bookmark_div.setAttribute("data-testid", "bookmarkBtn");
  bookmark_div.setAttribute("aria-label", "Bookmark");
  share_div.insertAdjacentElement("beforebegin", bookmark_div);

  const all_bookmark_buttons = share_div.parentNode.querySelectorAll('[data-testid="bookmarkBtn"]');
  for (let i = 0; i < all_bookmark_buttons.length - 1; i++) {
    all_bookmark_buttons[i].remove();
  }

  (browser || chrome).storage.local.get(['bookmarks'], (result) => {
    let bookmarks = result['bookmarks'] || [];
    const url_without_query = current_url.split("?")[0];
    const last_index = url_without_query.lastIndexOf("/");
    const post_id = url_without_query.substring(last_index + 1);

    for (let i = bookmarks.length - 1; i >= 0; i--) {
      if (bookmarks[i][1] === post_id) {
        bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_filled);
        bookmark_div.firstChild.firstChild.setAttribute("fill", bluesky_blue);
        bookmark_pressed = true;
        return;
      }
    }

    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_path);
  });

  bookmark_div.addEventListener("click", addBookmark);
}

// Adding navigation check for Firefox
let current_url = window.location.href;
setInterval(() => {
  if (window.location.href !== current_url) {
    current_url = window.location.href;
    addButton();
  }
}, 500);

addButton();
