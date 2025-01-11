var bookmarks

var page_number = 0
var page_size = 50

var bookmarks_content

var inputPageSizeElement
var inputPageNumberElement

// async function get_contents(){
//     GET https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://did:plc:6ue4xkpybsoukncszva67yoi/app.bsky.feed.post/3la5eiioyoj27&depth=0&parentHeight=0
// }

function load_bookmark(bookmark){
    const [did, postid, cid] = bookmark
    const embed_element = document.createElement("blockquote")
    embed_element.setAttribute("class", "bluesky-embed")
    embed_element.setAttribute("data-bluesky-uri", `at://did:plc:${did}/app.bsky.feed.post/${postid}`)
    embed_element.setAttribute("data-bluesky-cid", cid)
    document.getElementById("posts").insertAdjacentElement("beforeend",embed_element)
}

function load_page(){
    console.log("--------------------------------------------")
    const totalBookmarks = bookmarks.length;
    const startIndex = totalBookmarks - (page_number * page_size) - 1;
    const endIndex = Math.max(startIndex - page_size + 1, 0);
    for (let i = startIndex; i >= endIndex; i--) {
        load_bookmark(bookmarks[i]);
        console.log(i)
    }
    scan()
}

function update_page_display(){
    document.getElementById("current-page-input").value = page_number
    document.getElementById("page-size-input").value = page_size
    const nearby_pages = document.getElementById("nearby-pages")
    const last_page = Math.ceil(bookmarks.length/page_size)-1
    if (page_number >= 4) {
        nearby_pages.children[0].innerHTML = "0"
        nearby_pages.children[1].innerHTML = "..."
        
    }else{
        nearby_pages.children[0].innerHTML = ""
        nearby_pages.children[1].innerHTML = ""
        
    }
    if (page_number <= last_page-4) {
        nearby_pages.children[9].innerHTML = last_page.toString()
        nearby_pages.children[8].innerHTML = "..."
    }else{
        nearby_pages.children[9].innerHTML = ""
        nearby_pages.children[8].innerHTML = ""
    }
    for (let i = 1; i<=3; i++) {
        var previous_page_number = document.getElementById("previous"+i.toString())
        if (page_number-i >= 0) {
            previous_page_number.innerHTML = (page_number-i).toString()
        }else{
            previous_page_number.innerHTML = ""
        }
        var future_page_number = document.getElementById("future"+i.toString())
        if (page_number+i<=last_page) {
            future_page_number.innerHTML = (page_number+i).toString()
        }else{
            future_page_number.innerHTML = ""
        }
    }
}

function clear_bookmarks(){
    var posts = document.getElementById("posts")
    while (posts.firstChild) {
        posts.removeChild(posts.firstChild);
    }
}

function increment_page(difference){
    if (page_number + difference >= 0 && page_number + difference <= Math.floor((bookmarks.length-1)/page_size)){
        page_number += difference
        update_page_display()
        clear_bookmarks()
        load_page();
    }
}

function change_page(){
    var new_value = Number(inputPageNumberElement.value)
    if (new_value != page_number){
        if (isNaN(new_value)) {
            return
        }
        page_number = Math.min(Math.max(new_value, 0),Math.floor(bookmarks.length/page_size))
        update_page_display()
        clear_bookmarks()
        load_page()
    }
}

function change_page_size(new_value){
    var new_value = Number(inputPageSizeElement.value)
    if (new_value != page_size){
        // make sure they actually changed it
        if (isNaN(new_value) || new_value<0) {
            return
        }
        page_number = Math.floor(Math.min(bookmarks.length - 1, page_size*(page_number + 1) - 1) / new_value)
        page_size = new_value
        chrome.storage.local.set({'page_size': page_size},() => {})
        console.log(bookmarks.length)
        console.log(page_size)
        console.log(page_number)
        console.log(Math.floor(Math.min(bookmarks.length - 1, page_size*(page_number + 1) - 1) / new_value))
        update_page_display()
        clear_bookmarks()
        load_page()
    }
}

function click_page_number(number_element){
    console.log(number_element)
    inputPageNumberElement.value = Number(number_element.innerHTML)
    change_page()
}

chrome.storage.local.get(['bookmarks']).then((result) => {
    bookmarks = result['bookmarks'] || [];
    chrome.storage.local.get(['page_size']).then((result) => {
        if (result['page_size'] != undefined) {
            page_size = result['page_size']
        }else{
            page_size = 50
            chrome.storage.local.set({'page_size': 50},() => {})
        }
        page_size = result['page_size'] || [];
        update_page_display()
        load_page()
    })
})

document.addEventListener('DOMContentLoaded', function () {
    inputPageSizeElement = document.getElementById('page-size-input');
    if (inputPageSizeElement) {
        inputPageSizeElement.addEventListener('blur', change_page_size);
        document.getElementById('page-size-input-form').addEventListener('submit', change_page_size);
    } else {
        console.error('Element with ID "page-size-input" not found.');
    }
    inputPageNumberElement = document.getElementById('current-page-input');
    if (inputPageNumberElement) {
        inputPageNumberElement.addEventListener('blur', change_page);
        document.getElementById('current-page-input-form').addEventListener('submit', change_page_size);
    }
    document.getElementById('next-page-button').addEventListener('click', () => increment_page(1))
    document.getElementById('previous-page-button').addEventListener('click', () => increment_page(-1))
    const nearby_pages = document.getElementById("nearby-pages")
    for (var i = 0; i < nearby_pages.children.length; i++){
        if (!(i == 1 || i == 8)) {
            let j = nearby_pages.children[i]
            nearby_pages.children[i].addEventListener('click', (() => click_page_number(j)).bind(this))
        }
    }
});