<script lang="ts">
  import { type Auth, type User, getAuth } from "firebase/auth";

  import AppSignedIn from "./AppSignedIn.svelte";
  import Logout from "./lib/Logout.svelte";
  import { DEFAULT_CONTEXT, firebaseConfig } from "../common/constants";
  import { getStorage } from "firebase/storage";
  import { initializeApp } from "firebase/app";

  import "three-dots/dist/three-dots.min.css";

  const initializeUser = async (auth: Auth): Promise<User> => {
    const user = await new Promise<User>((resolve) =>
      auth.onAuthStateChanged(async (currentUser) => {
        if (currentUser !== null) {
          resolve(currentUser);
        } else {
          throw new Error("Not signed in");
        }
      })
    );
    return user;
  };

  const { transcodedBucket } = DEFAULT_CONTEXT;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const defaultStorage = getStorage(app);
  const transcodedStorage = getStorage(app, `gs://${transcodedBucket}`);
  const promise = initializeUser(auth);
</script>

<main>
  {#await promise}
    <div id="app-loading" class="dot-bricks" style="margin: 10px;" />
  {:then user}
    <AppSignedIn
      {auth}
      context={DEFAULT_CONTEXT}
      {defaultStorage}
      {transcodedStorage}
      {user}
    />
  {:catch}
    <h2 style="color: red;">An authentication error was occurred!</h2>
    <Logout {auth} />
  {/await}
</main>
