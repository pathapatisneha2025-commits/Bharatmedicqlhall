import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  SafeAreaView,
} from "react-native";

const { width, height } = Dimensions.get("window");

// ----- ProductCard Component -----
const ProductCard = ({ medicine, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <ImageCarousel images={medicine.images} />
      <View style={styles.info}>
        <Text style={styles.name}>{medicine.name}</Text>
        <Text style={styles.price}>₹ {medicine.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ----- ImageCarousel Component with Fullscreen Preview -----
const ImageCarousel = ({ images }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const openImage = (img) => {
    setSelectedImage(img);
    setModalVisible(true);
  };

  return (
    <View>
      {/* ✅ Horizontal Image Carousel */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {images.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={() => openImage(img)}
            activeOpacity={0.9}
          >
            <Image source={{ uri: img }} style={styles.image} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ✅ Dot Indicator */}
      <View style={styles.dotContainer}>
        {images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : null,
            ]}
          />
        ))}
      </View>

      {/* ✅ Fullscreen Image Modal */}
      <Modal
        visible={modalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{
              x: images.indexOf(selectedImage) * width,
              y: 0,
            }}
          >
            {images.map((img, idx) => (
              <View key={idx} style={styles.fullscreenImageContainer}>
                <Image source={{ uri: img }} style={styles.fullscreenImage} />
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

// ----- Styles -----
const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: "hidden",
    elevation: 2,
  },
  imageContainer: {
    width,
    height: 220,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  price: {
    fontSize: 15,
    color: "green",
    marginTop: 5,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "green",
  },

  // ✅ Fullscreen Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullscreenImageContainer: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },
  closeText: {
    color: "#fff",
    fontSize: 22,
  },
});

export default ProductCard;
