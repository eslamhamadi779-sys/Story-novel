rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ══════════════════════════════════════
    //  منع كل حاجة افتراضياً
    // ══════════════════════════════════════
    match /{document=**} {
      allow read, write: if false;
    }

    // ══════════════════════════════════════
    //  Helper Functions
    // ══════════════════════════════════════

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidStory(data) {
      return
        data.title    is string && data.title.size()   >= 1 && data.title.size()   <= 200  &&
        data.content  is string && data.content.size() >= 1 && data.content.size() <= 50000 &&
        data.category is string && data.category.size() >= 1 && data.category.size() <= 50  &&
        data.image    is string &&
        data.userId   == request.auth.uid &&
        data.userName is string &&
        data.userEmail is string &&
        data.createdAt == request.time;
    }

    // ══════════════════════════════════════
    //  Collection: stories
    // ══════════════════════════════════════
    match /stories/{storyId} {

      // أي حد يقرأ القصص — حتى من غير تسجيل دخول
      allow read: if true;

      // بس المسجلين يضيفوا قصة — وبشروط صحيحة
      allow create: if isSignedIn() && isValidStory(request.resource.data);

      // بس صاحب القصة يحذفها
      allow delete: if isOwner(resource.data.userId);

      // مفيش تعديل — القصص ثابتة
      allow update: if false;
    }

  }
}
