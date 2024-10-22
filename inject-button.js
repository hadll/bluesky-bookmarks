const bookmark_path = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5zM6.5 4c-.276 0-.5.22-.5.5v14.56l6-4.29 6 4.29V4.5c0-.28-.224-.5-.5-.5h-11z";
const bookmark_filled = "M4 4.5C4 3.12 5.119 2 6.5 2h11C18.881 2 20 3.12 20 4.5v18.44l-8-5.71-8 5.71V4.5z"

const bluesky_blue = "hsl(211, 99.1%, 56.1%)"
const default_gray = "hsl(211, 20%, 56%)"

var bookmark_div

var bookmark_pressed = false

const MAX_STORAGE_BYTES = 10 * 1024 * 1024;

function getSizeInBytes(object) {
  const jsonStr = JSON.stringify(object);
  return new Blob([jsonStr]).size;
}

function saveData(newBookmark) {
  chrome.storage.local.get(['bookmarks'], (result) => {
    let currentArray = result['bookmarks'] || [];
    const updatedArray = [...currentArray, newBookmark];
    chrome.storage.local.getBytesInUse(['bookmarks'], (currentBytes) => {
      const newDataSize = getSizeInBytes({ 'bookmarks': updatedArray });
      const projectedSize = currentBytes - getSizeInBytes(result) + newDataSize;
      if (projectedSize > MAX_STORAGE_BYTES) {
        alert(`You've run out of bookmark space... How... Go touch grass`);
      } else {
        chrome.storage.local.set({ 'bookmarks': updatedArray }, () => {
          console.log(`Bookmark added! New size: ${projectedSize} bytes.`);
          console.log(updatedArray)
        });
      }
    });
  });
}

async function getData(api_url) {
  chrome.runtime.sendMessage(
    { type: "FETCH_DATA", url: api_url },
    (response) => {
      if (response.success) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data.html, 'text/html');

        // Extract values from the blockquote element
        const blockquote = doc.querySelector('blockquote');
        const blueskyUri = blockquote.getAttribute('data-bluesky-uri');
        const blueskyCid = blockquote.getAttribute('data-bluesky-cid');

        const didMatch = blueskyUri.match(/did:plc:(\w+)/);
        const did = didMatch ? didMatch[1] : null;
        // Extract the post ID from the URI (last segment)
        const postId = blueskyUri.split('/').pop();

        // Log the extracted information
        console.log('Bluesky URI:', did);
        console.log('Bluesky CID:', blueskyCid);
        console.log('Post ID:', postId);
        saveData([did, postId, blueskyCid])
      } else {
        console.error("Error:", response.error);
      }
    }
  );
}

async function addBookmark() {
  bookmark_pressed = !bookmark_pressed
  if (bookmark_pressed) {
    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_filled)
    bookmark_div.firstChild.firstChild.setAttribute("fill", bluesky_blue)
    const api_url = document.head.querySelector('[type="application/json+oembed"]').href;
    console.log(await getData(api_url))
  } else {
    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_path)
    bookmark_div.firstChild.firstChild.setAttribute("fill", default_gray)
  }




}

window.addEventListener('load', function () {
  const share_button = document.querySelector('[data-testid="shareBtn"]');
  const share_div = share_button.parentNode;
  const buttons_container = share_div.parentNode;
  bookmark_div = share_button.cloneNode(true);
  bookmark_div.setAttribute("data-testid", "bookmarkBtn")
  share_div.insertAdjacentElement("beforebegin", bookmark_div)

  chrome.storage.local.get(['bookmarks'], (result) => {
    let bookmarks = result['bookmarks'] || [];
    const current_url = this.window.location.href;
    const url_without_query = current_url.split("?")[0];
    const last_index = url_without_query.lastIndexOf("/");
    const post_id = url_without_query.substring(last_index + 1);
    console.log(post_id)
    console.log(bookmarks.length)
    for (i = bookmarks.length - 1; i > 0; i--) {
      console.log(bookmarks[i][1])
      if (bookmarks[i][1] == post_id) {
        // we've already bookmarked this
        bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_filled)
        bookmark_div.firstChild.firstChild.setAttribute("fill", bluesky_blue)
        bookmark_pressed = true
        return
      };
    };
    bookmark_div.firstChild.firstChild.setAttribute("d", bookmark_path)
  });

  bookmark_div.addEventListener("click", addBookmark)
})

