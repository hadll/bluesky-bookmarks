var bookmarks
var tags

var page_number = 0
var page_size = 50

var bookmarks_content

var inputPageSizeElement
var inputPageNumberElement

// async function get_contents(){
//     GET https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=at://did:plc:6ue4xkpybsoukncszva67yoi/app.bsky.feed.post/3la5eiioyoj27&depth=0&parentHeight=0
// }

function save_tags(){
    chrome.storage.local.set({ 'tags': tags },()=> {})
}

function tag_context_button_click(tag, is_post){
    if (is_post){
        tagged_posts = tags[tag.getElementById("name").innerText]["tags"]
        tagged_posts.splice(tagged_posts.indexOf(tag.id),1)
        save_tags()
    }
    tag.remove()
}

function create_new_tag(name, colour){
    tags[name] = []
    tags[name]["color"] = colour
    tags[name]["tags"] = []
}

function create_tag_element(parent, name, colour, is_post){
    const tag_element = document.createElement("div")
    tag_element.setAttribute("class", "tag")
    tag_element.style["background-color"] = colour
    const context_button = document.createElement("img")
    context_button.setAttribute("class","tag-button")
    const tag_name = document.createElement("span")
    tag_name.id = "name"
    tag_name.innerText = name
    tag_element.appendChild(context_button)
    tag_element.appendChild(tag_name)
    parent.appendChild(tag_element)

    context_button.addEventListener('click', () => tag_context_button_click(tag_element, is_post))
}

function create_add_tag(parent, is_post){
    const tag_element = document.createElement("div")
    tag_element.setAttribute("class", "tag")
    const context_button = document.createElement("img")
    context_button.setAttribute("class","add-tag-button")
    const tag_name = document.createElement("span")
    tag_name.id = "name"
    tag_name.innerText = "Add Tag"
    tag_element.appendChild(context_button)
    tag_element.appendChild(tag_name)
    parent.appendChild(tag_element)

    context_button.addEventListener('click', () => tag_context_button_click(tag_element, is_post))
}

function load_bookmark(bookmark){
    const [did, postid, cid] = bookmark
    const embed_element = document.createElement("blockquote")
    embed_element.setAttribute("class", "bluesky-embed")
    embed_element.setAttribute("data-bluesky-uri", `at://did:plc:${did}/app.bsky.feed.post/${postid}`)
    embed_element.setAttribute("data-bluesky-cid", cid)
    embed_element.id = postid

    document.getElementById("posts").insertAdjacentElement("beforeend",embed_element)

    const tag_container = document.createElement("div")
    tag_container.setAttribute("class", "tag-container")
    document.getElementById("posts").insertAdjacentElement("beforeend", tag_container)

    for (i=0; i<=0; i++){
        create_tag_element(tag_container, "Meme", "rgb(83, 112, 255)")
        create_tag_element(tag_container, "Video Games", "rgb(83, 255, 109)")
        create_tag_element(tag_container, "Image", "rgb(195, 83, 255)")
        create_add_tag(tag_container, false)
    }
    console.log(tag_container.parentElement)
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
        nearby_pages.children[0].innerText = "0"
        nearby_pages.children[1].innerText = "..."
        
    }else{
        nearby_pages.children[0].innerText = ""
        nearby_pages.children[1].innerText = ""
        
    }
    if (page_number <= last_page-4) {
        nearby_pages.children[9].innerText = last_page.toString()
        nearby_pages.children[8].innerText = "..."
    }else{
        nearby_pages.children[9].innerText = ""
        nearby_pages.children[8].innerText = ""
    }
    for (let i = 1; i<=3; i++) {
        var previous_page_number = document.getElementById("previous"+i.toString())
        if (page_number-i >= 0) {
            previous_page_number.innerText = (page_number-i).toString()
        }else{
            previous_page_number.innerText = ""
        }
        var future_page_number = document.getElementById("future"+i.toString())
        if (page_number+i<=last_page) {
            future_page_number.innerText = (page_number+i).toString()
        }else{
            future_page_number.innerText = ""
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
        if (isNaN(new_value) || new_value<1) {
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
    inputPageNumberElement.value = Number(number_element.innerText)
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
        chrome.storage.local.get(['tags']).then((result) => {
            tags = result['tags'] || [];
        })
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