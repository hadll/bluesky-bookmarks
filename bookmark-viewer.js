chrome.storage.local.get(['bookmarks'], (result) => {
    console.log("bookmarks gotten")
    let bookmarks = result['bookmarks'] || [];
    console.log(bookmarks.length)
    for(i=bookmarks.length-1;i>=0;i--){
        console.log(bookmarks[i])
        const [did, postid, cid] = bookmarks[i]
        // const new_embed = `<blockquote class="bluesky-embed"data-bluesky-uri="at://did:plc:${did}/app.bsky.feed.post/${postid}"data-bluesky-cid="${cid}"></blockquote>`
        const embed_element = document.createElement("blockquote")
        embed_element.setAttribute("class", "bluesky-embed")
        embed_element.setAttribute("data-bluesky-uri", `at://did:plc:${did}/app.bsky.feed.post/${postid}`)
        embed_element.setAttribute("data-bluesky-cid", cid)
        this.document.body.insertAdjacentElement("beforeend",embed_element)
        
    }
    scan()
})