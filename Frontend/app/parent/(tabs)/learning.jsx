import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useState, useRef } from "react";
import { WebView } from "react-native-webview";
import { Audio } from "expo-av";
import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

const LearningContent = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("video");
  const [sound, setSound] = useState();
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoStates, setVideoStates] = useState({});
  const webViewRefs = useRef({});

  const content = {
    videos: [
      {
        id: "1",
        url: "https://www.youtube.com/embed/22T-6duM9nI?playsinline=1&fs=1",
      },
      {
        id: "2",
        url: "https://www.youtube.com/embed/PHpPtdk9rco?playsinline=1&fs=1",
      },
    ],
    audios: [
      {
        id: "1",
        title:
          "The Single Most Important Parenting Strategy | Becky Kennedy | TED",
        url: "https://rr3---sn-qxaelnl7.googlevideo.com/videoplayback?expire=1740269610&ei=yhO6Z9-WJtTGi9oPmevR2AI&ip=176.1.194.18&id=o-AJztcullSUhts3xbKwf97AvO_w8kgzAXhgbpS5GgnkQY&itag=249&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&bui=AUWDL3xD60G0Qs4gH5tpnLnlwlKvg-2JCwe_WelGR2U-aMj1Bj-OPtRcBSO8IQ7r2r_TZ5FgLNBeDvPr&spc=RjZbSX9FxQikY68ScgMQoFw0-8evqFQRDaD1lloW5f08KY5yfw&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=mytLvoDuLWnNNbS-hShBg8oQ&rqh=1&gir=yes&clen=5196978&dur=843.961&lmt=1739346125875368&keepalive=yes&fexp=24350590,24350737,24350827,24350961,24351129,24351173,51326932,51355912&c=WEB&sefc=1&txp=4532534&n=0oRyWoX5_pwSwg&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRAIgcbUiwS59b79w76sEg66JKuICbicShBY7gmmtP9DZo7kCIAmSfMm34asF6iqhBhuSkMMVZiaauh_cU-5nBeZlDCo5&pot=MnR-TMaeP3QOB35wS_bbrFjsXvsLGgXw4wj_83ewzpZJdKR_stL1Ajk65SZgNQkbWfnKXWk5_14Bml0bW964l_gk3icI8JlxLsRxF63nkmx-vij0Brovu3_CzHtxLdSDOqu35glHCUeCVr02atEN7UH9lKs5zg==&rm=sn-uxax4vopj5qx-q0n67l,sn-4g5ery7s&rrc=79,104,191&req_id=233a8ed01b8ea3ee&rms=rdu,au&ipbypass=yes&redirect_counter=3&cm2rm=sn-gwpa-qxae776&cms_redirect=yes&cmsv=e&met=1740248091,&mh=VM&mip=2405:201:5808:d072:84d7:cdd7:9bd1:17ef&mm=30&mn=sn-qxaelnl7&ms=nxu&mt=1740247714&mv=m&mvi=3&pl=49&tso=0&lsparams=ipbypass,met,mh,mip,mm,mn,ms,mv,mvi,pl,rms,tso&lsig=AGluJ3MwRgIhAKyXyy2-Rz-HC3tPRhOopEoXH6TL3fPKyWIC6YAYyNu2AiEAuektGEoxhdxzX3o4FU2T76jv1Hny6MEA42LM77MX_vE%3D",
      },
      {
        id: "2",
        title: "3 Parenting Tips By Sandeep Maheshwari",
        url: "https://rr2---sn-npoeenly.googlevideo.com/videoplayback?expire=1740268912&ei=EBG6Z_y2Ge_c6dsP4oeI2Ag&ip=176.1.205.88&id=o-ACDMkto1LcZ46zrsVe2P0qBVwt1cphDWw3b5mIwmCsOi&itag=249&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&bui=AUWDL3ykhygARIwoLBz8ZvhSmWtR0qvNDIUiKcyo0ycDmAeLZc7x2AOK7OevT7MEZFdQj-vQi1dtCBsE&spc=RjZbSfAL0QEy8JZ18La-ZL1rXAh6yZ5w-cvNXzEEy3GgAshHBg&vprv=1&svpuc=1&xtags=drc%3D1&mime=audio%2Fwebm&ns=2sQdcZc0pSDfAkh94hDBcp8Q&rqh=1&gir=yes&clen=6421878&dur=1041.561&lmt=1683115161070920&keepalive=yes&fexp=24350590,24350737,24350827,24350961,24351093,24351130,24351173,51326932,51355912&c=WEB&sefc=1&txp=4532434&n=s-W7oMPm4JLzQg&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cxtags%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRAIgbBLx1GlpilA0SEMKrwyFaZgzdfxwCzgJj_m4rzzsjXwCIEclJ3Th4iYp8Kjy_aY0kZmMDhwq_NEyjvb3eB5RZQgx&pot=MkjKj9vyIe2Eg8qzDXNBk0rv5181km_9k_jR3_f7tVuqY2ETASwWNW50Q1AnK7DVKlF2CJTpoNplHZJaoz1DVu1PWv4QdR8Pi-o=&rm=sn-uxax4vopj5qx-q0n676&rrc=79,80&req_id=821b95918fd0a3ee&redirect_counter=2&cm2rm=sn-4g5e6e7e&cms_redirect=yes&cmsv=e&met=1740247320,&mh=Gr&mip=2405:201:5808:d072:84d7:cdd7:9bd1:17ef&mm=34&mn=sn-npoeenly&ms=ltu&mt=1740246447&mv=u&mvi=2&pl=38&rms=ltu,au&lsparams=met,mh,mip,mm,mn,ms,mv,mvi,pl,rms&lsig=AGluJ3MwRQIgeNAv38nrwhdROY0t3KCcbxtJpWHMf_BBBNGcSSqX3LMCIQCChNWVNONgrLnTDAxaPJDI6ZFZVY-RCwrHMKdJXpSVAg%3D%3D",
      },
      {
        id: "3",
        title:
          "How to Raise Successful Kids -- Without Over-Parenting | Julie Lythcott-Haims | TED",
        url: "https://rr1---sn-npoe7ne7.googlevideo.com/videoplayback?expire=1740269840&ei=sBS6Z_jrMPPb6dsPv7mx8QY&ip=176.1.221.139&id=o-AGSUp3TPbMWdHk44mhnWu_2MBUiYa21EKl0mujMMDb-f&itag=249&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&bui=AUWDL3wvow-kqlxKTG-NNhH2a8-1MyGHR2EXKK6sa9UXsRQZUNXrlFnuBL_-PTC-0MJ3YqeErxHws78-&spc=RjZbSU41gr4Ypt1dqh2YjSGV0sqIlKKKeAkSvwo65gIIUkvJZA&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=q2f-eHx9vp2v7qimXXNBRN0Q&rqh=1&gir=yes&clen=5443572&dur=856.201&lmt=1732399508070566&keepalive=yes&fexp=24350590,24350737,24350827,24350961,24351130,24351173,51326932,51355912&c=WEB&sefc=1&txp=4532434&n=Hh4LBgzeJRIPxg&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIgIuQVJDBSINfrm-GwlOIJq0xByuE45AM0jE1QVAu03zICIQDxkU3fnEsCfHQL_dQ0I-23o7vf0KPq2goqWXI-qFuVVA%3D%3D&pot=MnTCKG8V7Te5RcIUncir2Arh1G_3X2QUUXSXOKeT6KpyvbODjPc8hNi3k2LnZpHi_BatJ9RG33x6GNc5EmBfDT6UZnK2sWvZOJsCj7scsLbBN0g5o_s1VJicTAQHEVWxvaG7b_uezirncZbmpAojq5H1o1sDeQ==&rm=sn-uxax4vopj5qx-q0n67l&rrc=79,80&req_id=2f4f20227b07a3ee&redirect_counter=2&cm2rm=sn-4g5ezl76&cms_redirect=yes&cmsv=e&met=1740248253,&mh=Qx&mip=2405:201:5808:d072:84d7:cdd7:9bd1:17ef&mm=34&mn=sn-npoe7ne7&ms=ltu&mt=1740247646&mv=u&mvi=1&pl=38&rms=ltu,au&lsparams=met,mh,mip,mm,mn,ms,mv,mvi,pl,rms&lsig=AGluJ3MwRQIhALc77CnTgwkzOOvrvpPXhaOXwgHPDyHWajDMdoncAg9sAiBAD4e8I-ZTjRUDzGV1ZQTw9VzQmbua_vOCMfUsYSIp9Q%3D%3D",
      },
      {
        id: "4",
        title:
          "Biggest Parenting Mistake | Sandeep Maheshwari | How To Choose Your Career",
        url: "https://rr5---sn-gwpa-qxay.googlevideo.com/videoplayback?expire=1740269373&ei=3RK6Z4emJsiH6dsPtYK8wAQ&ip=176.6.141.128&id=o-AC6bqPEv9CBYg4SLYkzFk9Kbr1k6L41h7nEGRh6tsMnG&itag=249&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&bui=AUWDL3wZYMeFyLXueSve68jyjQEPsGZOH2fccyNpL4tCOlt1J7bmPeiqrvU7pMZ0ow0dLHXaHWaI7jHm&spc=RjZbSaToVZdcUvj020VRiu378trtvQizJkZ2g1yWTEhXpK2bmA&vprv=1&svpuc=1&mime=audio%2Fwebm&ns=UUGthxVfe0gQWgorojbGVLAQ&rqh=1&gir=yes&clen=4911847&dur=819.381&lmt=1733841356737403&keepalive=yes&fexp=24350590,24350737,24350827,24350961,24351130,24351173,51326932,51355912&c=WEB&sefc=1&txp=5532434&n=JLfCZP7NK-opbg&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cdur%2Clmt&sig=AJfQdSswRQIhAL5uBbwekL50X4m47ytxt1Nlpz6YagZSLDEb7urXYYm2AiA5rODwiryO7C_YL-03xZIjegdr4ZbxGxl4h_UHeOR5ow%3D%3D&pot=MnS9nqAMgYyu972iXKQHkohA1cO67hNyuP4Ybhovfp2yCM0G6tiRFD2ytsCDo1BO2LWXnr2yfCKXJy0W7sTQafKAHNFBwmKbfh5jLO7dTt0Kmp77DjQ_S45iNTL7uvY9uU_nzNlwHHzbycn3TkGu6HRaky6eRg==&rm=sn-uxax4vopj5qx-cxgl7z,sn-4g5ekk7z&rrc=79,104&req_id=1929ae6c33daa3ee&rms=rdu,au&redirect_counter=2&cms_redirect=yes&cmsv=e&ipbypass=yes&met=1740247832,&mh=d8&mip=2405:201:5808:d072:84d7:cdd7:9bd1:17ef&mm=29&mn=sn-gwpa-qxay&ms=rdu&mt=1740246436&mv=u&mvi=5&pl=49&lsparams=ipbypass,met,mh,mip,mm,mn,ms,mv,mvi,pl,rms&lsig=AGluJ3MwRQIgKIEX17B6at0QRlRx6T5J7BTob3vmFqUyrwksSW39TzkCIQDFQP0gobTsIwjPgAEu8x990mbXi2onxrQVy-utekeIcw%3D%3D",
      },
    ],
  };

  const toggleVideo = (videoId) => {
    const webViewRef = webViewRefs.current[videoId];
    if (webViewRef) {
      webViewRef.injectJavaScript(`
        (function() {
          const video = document.getElementsByTagName('video')[0];
          if (video) {
            if (video.paused) {
              video.play();
              window.ReactNativeWebView.postMessage('playing');
            } else {
              video.pause();
              window.ReactNativeWebView.postMessage('paused');
            }
          }
          true;
        })();
      `);
    }
  };

  const handleProgressBarPress = async (event, measureLayout) => {
    if (!sound || !duration) return;

    try {
      const { locationX } = event.nativeEvent;
      const progressBarWidth = measureLayout.width;
      const position = (locationX / progressBarWidth) * duration;
      await sound.setPositionAsync(position);
      setPosition(position);
    } catch (error) {
      console.error("Error seeking audio:", error);
    }
  };

  const seekAudio = async (forward = true) => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();
      const currentPosition = status.positionMillis;
      const seekAmount = 10000; // 10 seconds in milliseconds

      let newPosition = forward
        ? currentPosition + seekAmount
        : currentPosition - seekAmount;

      newPosition = Math.max(0, Math.min(newPosition, duration));

      await sound.setPositionAsync(newPosition);
      setPosition(newPosition);
    } catch (error) {
      console.error("Error seeking audio:", error);
    }
  };

  async function playSound(audioUrl, audioId) {
    try {
      // If the same audio is playing, toggle play/pause
      if (sound && playingAudioId === audioId) {
        const status = await sound.getStatusAsync();
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsAudioPlaying(false);
        } else {
          await sound.playAsync();
          setIsAudioPlaying(true);
        }
        return;
      }

      // If a different audio is playing, stop it first
      if (sound) {
        await sound.unloadAsync();
        setIsAudioPlaying(false);
      }

      console.log("Loading Sound");
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis);
          }
        }
      );

      setSound(newSound);
      setPlayingAudioId(audioId);
      setIsAudioPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setIsAudioPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setPlayingAudioId(null);
            setSound(null);
            setPosition(0);
            setIsAudioPlaying(false);
          }
        }
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingAudioId(null);
      setSound(null);
      setIsAudioPlaying(false);
    }
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log("Unloading Sound");
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const formatTime = (millis) => {
    if (!millis) return "0:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  const renderContent = () => {
    if (activeTab === "video") {
      return (
        <ScrollView
          className="flex-1 px-4 pt-2"
          showsVerticalScrollIndicator={false}
        >
          {content.videos.map((video) => (
            <View
              key={video.id}
              style={{ height: 220, marginBottom: 20 }}
              className="rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <TouchableOpacity
                onPress={() => toggleVideo(video.id)}
                className="flex-1"
                activeOpacity={1}
              >
                <View className="absolute z-10 items-center justify-center w-full h-full">
                  <MaterialIcons
                    name={
                      videoStates[video.id]
                        ? "pause-circle-outline"
                        : "play-circle-outline"
                    }
                    size={50}
                    color="white"
                    style={{ opacity: 0.8 }}
                  />
                </View>
                <WebView
                  ref={(ref) => (webViewRefs.current[video.id] = ref)}
                  className="w-full h-full"
                  source={{
                    uri: video.url,
                    headers: {
                      Accept:
                        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                    },
                  }}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  allowsFullscreenVideo={true}
                  scalesPageToFit={true}
                  style={{ opacity: 0.99 }}
                  onLoad={() => {
                    webViewRefs.current[video.id]?.injectJavaScript(`
                      (function() {
                        const video = document.getElementsByTagName('video')[0];
                        if (video) {
                          video.addEventListener('play', function() {
                            window.ReactNativeWebView.postMessage('playing');
                          });
                          video.addEventListener('pause', function() {
                            window.ReactNativeWebView.postMessage('paused');
                          });
                          // Initial state check
                          if (!video.paused) {
                            window.ReactNativeWebView.postMessage('playing');
                          }
                        }
                        true;
                      })();
                    `);
                  }}
                  onMessage={(event) => {
                    if (event.nativeEvent.data === "playing") {
                      setVideoStates((prev) => ({ ...prev, [video.id]: true }));
                    } else if (event.nativeEvent.data === "paused") {
                      setVideoStates((prev) => ({
                        ...prev,
                        [video.id]: false,
                      }));
                    }
                  }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      );
    }

    return (
      <ScrollView
        className="flex-1 px-4 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {content.audios.map((audio) => (
          <TouchableOpacity
            key={audio.id}
            activeOpacity={0.7}
            className="mb-3 bg-white rounded-xl shadow-sm overflow-hidden"
            onPress={() => playSound(audio.url, audio.id)}
          >
            <View className="flex-row items-center p-4 border border-gray-500 rounded-xl">
              <View className="h-10 w-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <MaterialIcons
                  name={
                    playingAudioId === audio.id && isAudioPlaying
                      ? "pause-circle-filled"
                      : "play-circle-fill"
                  }
                  size={24}
                  color="#3b82f6"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">
                  {audio.title}
                </Text>
                <Text className="text-sm text-blue-500 mt-1">
                  {playingAudioId === audio.id
                    ? isAudioPlaying
                      ? "Playing..."
                      : "Paused"
                    : "Tap to play"}
                </Text>
                {playingAudioId === audio.id && (
                  <View className="mt-2">
                    <View className="flex-row items-center mb-2">
                      <TouchableOpacity
                        onPress={() => seekAudio(false)}
                        className="mr-4"
                      >
                        <MaterialIcons
                          name="replay-10"
                          size={24}
                          color="#3b82f6"
                        />
                      </TouchableOpacity>

                      <Text className="text-xs text-gray-500 mr-4">
                        {formatTime(position)} / {formatTime(duration)}
                      </Text>

                      <TouchableOpacity onPress={() => seekAudio(true)}>
                        <MaterialIcons
                          name="forward-10"
                          size={24}
                          color="#3b82f6"
                        />
                      </TouchableOpacity>
                    </View>

                    <View
                      onLayout={(event) => {
                        const { width } = event.nativeEvent.layout;
                        audio.progressBarWidth = width;
                      }}
                    >
                      <Pressable
                        onPress={(event) =>
                          handleProgressBarPress(event, {
                            width: audio.progressBarWidth,
                          })
                        }
                        className="h-2 bg-gray-200 rounded-full overflow-hidden"
                      >
                        <View
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(position / duration) * 100}%`,
                          }}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View className="flex-1 bg-gray-50">
        {/* Tab Bar */}
        <View className="px-4 pt-2 pb-1">
          <View className="flex-row bg-white rounded-full p-1 shadow-sm">
            <TouchableOpacity
              activeOpacity={0.7}
              className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-xl ${
                activeTab === "video" ? "bg-blue-500" : ""
              }`}
              onPress={() => setActiveTab("video")}
            >
              <MaterialIcons
                name="play-circle-outline"
                size={20}
                color={activeTab === "video" ? "white" : "#6b7280"}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`text-base font-medium ${
                  activeTab === "video" ? "text-white" : "text-gray-500"
                }`}
              >
                {t("Video")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              className={`flex-1 flex-row items-center justify-center py-2.5 px-4 rounded-xl ${
                activeTab === "audio" ? "bg-blue-500" : ""
              }`}
              onPress={() => setActiveTab("audio")}
            >
              <MaterialIcons
                name="headset"
                size={20}
                color={activeTab === "audio" ? "white" : "#6b7280"}
                style={{ marginRight: 6 }}
              />
              <Text
                className={`text-base font-medium ${
                  activeTab === "audio" ? "text-white" : "text-gray-500"
                }`}
              >
                {t("Audio")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {renderContent()}
      </View>
    </>
  );
};

export default LearningContent;
