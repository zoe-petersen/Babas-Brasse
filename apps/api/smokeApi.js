const { createApiServer } = require("./server.js");
const { SubmissionStore } = require("./submissionStore.js");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const payload = await response.json();
  return { response, payload };
}

async function smokeApi() {
  const uploadRoot = fs.mkdtempSync(path.join(os.tmpdir(), "babas-uploads-"));
  const store = new SubmissionStore(null, {
    memory: true,
    seed: {
      categories: [{ id: "essays", slug: "essays", label: "Essays" }],
      articles: [{ id: "article-1", slug: "handoff-check", title: "Handoff Check", status: "published" }]
    }
  });
  const server = createApiServer({
    store,
    environment: { NODE_ENV: "test" },
    adminEmail: "editor@example.com",
    adminPassword: "handoff-password",
    uploadRoot
  });

  await server.storeReady;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const health = await request(baseUrl, "/api/health");
    assert(health.response.status === 200 && health.payload.status === "ok", "Health check failed.");

    const content = await request(baseUrl, "/api/content");
    assert(content.response.status === 200, "Content endpoint failed.");
    assert(content.payload.articles?.some((article) => article.slug === "handoff-check"), "Published content is missing.");

    const invalidContact = await request(baseUrl, "/api/contact-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Reader", email: "invalid", subject: "Hello", message: "Test" })
    });
    assert(invalidContact.response.status === 422, "Invalid contact submission was not rejected.");

    const contact = await request(baseUrl, "/api/contact-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Reader",
        email: "reader@example.com",
        subject: "Editorial enquiry",
        message: "Checking the handoff workflow."
      })
    });
    assert(contact.response.status === 201 && contact.payload.status === "new", "Contact submission failed.");

    const comment = await request(baseUrl, "/api/articles/handoff-check/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Thoughtful Reader",
        body: "This should remain hidden until an administrator publishes it."
      })
    });
    assert(comment.response.status === 201 && comment.payload.status === "pending", "Pending comment submission failed.");

    const login = await request(baseUrl, "/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "editor@example.com", password: "handoff-password" })
    });
    const cookie = login.response.headers.get("set-cookie");
    assert(login.response.status === 200 && cookie, "Admin login failed.");

    const inbox = await request(baseUrl, "/api/admin/contact-submissions", {
      headers: { Cookie: cookie }
    });
    assert(inbox.response.status === 200, "Admin contact inbox failed.");
    assert(inbox.payload.items?.some((item) => item.id === contact.payload.id), "Stored contact submission is missing from admin inbox.");

    const inProgressContact = await request(baseUrl, `/api/admin/contact-submissions/${encodeURIComponent(contact.payload.id)}`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "read" })
    });
    assert(inProgressContact.response.status === 200 && inProgressContact.payload.status === "read", "Contact progress update failed.");

    const publishedComment = await request(baseUrl, `/api/admin/comments/${encodeURIComponent(comment.payload.id)}`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "approved" })
    });
    assert(publishedComment.response.status === 200 && publishedComment.payload.status === "approved", "Comment moderation failed.");

    const upload = await request(baseUrl, "/api/admin/uploads", {
      method: "POST",
      headers: {
        Cookie: cookie,
        "Content-Type": "image/png",
        "X-File-Name": encodeURIComponent("smoke-check.png"),
        "X-Media-Title": encodeURIComponent("Smoke check"),
        "X-Alt-Text": encodeURIComponent("A one-pixel upload test")
      },
      body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    });
    assert(upload.response.status === 201 && upload.payload.type === "image", "Admin media upload failed.");
    assert(upload.payload.url?.startsWith("/api/media/uploads/"), "Uploaded media URL is invalid.");

    const uploadedMedia = await fetch(`${baseUrl}${upload.payload.url}`);
    assert(uploadedMedia.status === 200, "Uploaded media could not be retrieved.");
    assert(uploadedMedia.headers.get("content-type") === "image/png", "Uploaded media content type is incorrect.");
    assert((await uploadedMedia.arrayBuffer()).byteLength > 0, "Uploaded media is empty.");

    const article = await request(baseUrl, "/api/admin/articles", {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "admin-editor-check",
        slug: "admin-editor-check",
        title: "Admin Editor Check",
        dek: "A complete article created through the admin editor contract.",
        status: "published",
        categoryId: "essays",
        authorProfileId: "editor",
        featuredImage: upload.payload,
        featuredImageId: upload.payload.id,
        altText: "A one-pixel upload test",
        body: "The first paragraph.\n\nThe second paragraph.",
        seoTitle: "Admin Editor Check | Babas & Brasse",
        seoDescription: "A complete article created through the admin editor contract."
      })
    });
    assert(article.response.status === 201 && article.payload.status === "published", "Article editor save failed.");

    const unpublishedArticle = await request(baseUrl, `/api/admin/articles/${encodeURIComponent(article.payload.id)}`, {
      method: "PATCH",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "draft" })
    });
    assert(unpublishedArticle.response.status === 200 && unpublishedArticle.payload.status === "draft", "Article unpublish failed.");

    const publicAfterModeration = await request(baseUrl, "/api/content");
    assert(
      publicAfterModeration.payload.comments?.some((item) => item.id === comment.payload.id),
      "Approved comment is missing from public content."
    );
    assert(
      !publicAfterModeration.payload.articles?.some((item) => item.id === article.payload.id),
      "Unpublished article remained visible in public content."
    );

    const deletedArticle = await request(baseUrl, `/api/admin/articles/${encodeURIComponent(article.payload.id)}`, {
      method: "DELETE",
      headers: { Cookie: cookie }
    });
    assert(deletedArticle.response.status === 200 && deletedArticle.payload.id === article.payload.id, "Permanent article deletion failed.");

    process.stdout.write("API handoff smoke passed.\n");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(uploadRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  smokeApi().catch((error) => {
    process.stderr.write(`API handoff smoke failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { smokeApi };
