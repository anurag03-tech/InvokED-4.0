import React from "react";
import { View, Image } from "react-native";
import LanguageSelector from "./LanguageSelector";

const ParentHeader = () => (
  <View
    className={`h-[50px] p-1  flex-row justify-between border-b border-gray-300 bg-white`}
  >
    <View>
      <Image
        source={require("../../../assets/images/app_logo.jpg")}
        style={{ width: 200, height: 40 }}
      />
    </View>
    <LanguageSelector />
  </View>
);
export default ParentHeader;
