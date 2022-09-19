<script lang="ts">
  let files: FileList;
  let src: string;
  let videoRef: HTMLVideoElement

  function handleFileChange() {
    const file = files[0]
    if (typeof file === 'undefined') return;
    src = URL.createObjectURL(file)
  }

  function handlePlaybackRate1x() {
    videoRef.playbackRate = 1.0;
  }

  function handlePlaybackRate2x() {
    videoRef.playbackRate = 2.0;
  }

  function handleFullscreen() {
    if (videoRef.requestFullscreen) {
      videoRef.requestFullscreen();
    } else {
      const anyVideoRef = videoRef as any 
      if (anyVideoRef.webkitRequestFullscreen) {
        anyVideoRef.webkitRequestFullscreen();
      } else if (anyVideoRef.webkitEnterFullscreen) {
        anyVideoRef.webkitEnterFullscreen();
      }
    }
  }
</script>

<main>
  <p>
    <a href="app.html">エンコード</a>
  </p>
  <h2>使い方</h2>
  <ol>
    <li>「ファイルを選択」で編集したいファイルを選択します</li>
    <li>「1x」を押すと1倍速、「4x」を押すと4倍速になります</li>
    <li>「全画面」を押すと動画が全画面に表示されます</li>
    <li>アップロードしたい動画の開始点まで再生してください</li>
    <li>この状態で画面収録を開始してください、音声も収録してください</li>
  </ol>
  <input type="file" multiple bind:files on:change={handleFileChange} />
  <button on:click={handlePlaybackRate1x}>1x</button>
  <button on:click={handlePlaybackRate2x}>2x</button>
  <button on:click={handleFullscreen}>全画面</button>
  <div>
    <video {src} controls bind:this={videoRef} width="400"></video>
  </div>
</main>