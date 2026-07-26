import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

// export const addToCart = async (userId, variantId, quantity) => {
//   // check quantity
//   if (!quantity || quantity <= 0) {
//     throw new Error("Quantity không hợp lệ");
//   }

//   // tìm sản phẩm có variantId từ client req
//   const variant =
//     await ProductVariant.findById(variantId).populate("productId");

//   // kiểm tra có sản phẩm đó không
//   if (!variant) {
//     throw new Error("Variant không tồn tại");
//   }

//   // dữ liệu sản phẩm lấy thông qua variant populate (productId)
//   const product = variant.productId;

//   // check stock
//   if (variant.stock < quantity) {
//     throw new Error("Không đủ hàng");
//   }
//   //tìm giỏ hàng theo userID
//   let cart = await Cart.findOne({ userId });

//   // nếu userID chưa có giỏ hàng thì tạo mới giỏ hàng cho userId
//   if (!cart) {
//     cart = await Cart.create({
//       userId,

//       items: [
//         {
//           productId: product._id,
//           variantId: variant._id,
//           sku: variant.sku,
//           name: product.name,
//           image: variant.image || product.image,
//           attributes: variant.attributes,
//           price: variant.price,
//           quantity,
//         },
//       ],
//     });

//     return cart;
//   }

//   // kiểm tra sản phẩm đã có trong cart chưa
//   const itemIndex = cart.items.findIndex(
//     (item) => item.variantId.toString() === variantId,
//   );

//   // đã có thì tăng quantity
//   if (itemIndex > -1) {
//     // đã có → update quantity (có check stock)
//     const newQuantity = cart.items[itemIndex].quantity + quantity;

//     if (newQuantity > variant.stock) {
//       throw new Error("Vượt quá số lượng tồn kho");
//     }

//     cart.items[itemIndex].quantity = newQuantity;
//   } else {
//     // chưa có → thêm mới
//     cart.items.push({
//       productId: product._id,
//       variantId: variant._id,
//       sku: variant.sku,
//       name: product.name,
//       image: variant.image || product.image,
//       attributes: variant.attributes,
//       price: variant.price,
//       quantity,
//     });
//   }

//   // lưu giỏ hàng
//   await cart.save();

//   return cart;
// };


export const addToCart = async (userId, variantId, quantity) => {
  console.log("--- BẮT ĐẦU ADD TO CART ---");
  console.log("Input:", { userId, variantId, quantity });

  if (!quantity || quantity <= 0) throw new Error("Quantity không hợp lệ");

  // 1. Tìm variant
  const variant = await ProductVariant.findById(variantId).populate("productId");
  if (!variant) throw new Error("Variant không tồn tại");

  // Debug populate
  console.log("Variant sau khi populate:", variant);
  
  if (!variant.productId) {
    throw new Error("Sản phẩm không có thông tin productId hợp lệ");
  }

  // Debug productId
  const productId = variant.productId._id;
  console.log("productId lấy được:", productId);
  console.log("Kiểu dữ liệu của productId:", typeof productId); 
  console.log("Constructor của productId:", productId.constructor.name);

  // 3. Kiểm tra kho
  if (variant.stock < quantity) throw new Error("Không đủ hàng");

  // 4. Tìm hoặc tạo
  let cartItem = await Cart.findOne({ userId, variantId });

  if (!cartItem) {
    const dataToCreate = {
      userId,
      variantId,
      productId, 
      quantity,
    };
    
    console.log("ĐANG GỌI Cart.create với data:", dataToCreate);
    
    try {
      cartItem = await Cart.create(dataToCreate);
      console.log("Create thành công!");
    } catch (err) {
      console.error("LỖI KHI Cart.create:", err);
      // Nếu lỗi là validation, err.errors sẽ chứa thông tin cụ thể
      if (err.errors && err.errors.productId) {
        console.error("Chi tiết lỗi productId:", err.errors.productId.message);
      }
      throw err; // Ném lỗi để controller bắt
    }
    return cartItem;
  }

  // 5. Cập nhật số lượng
  const newQuantity = cartItem.quantity + quantity;
  if (newQuantity > variant.stock) throw new Error("Vượt quá số lượng tồn kho");

  cartItem.quantity = newQuantity;
  await cartItem.save();

  return cartItem;
};

// export const getCart = async (userId) => {
//   // lấy cart của user
//   const cart = await Cart.findOne({ userId });

//   // xử lí cart rỗng
//   if (!cart) {
//     return {
//       userId,
//       items: [],
//     };
//   }

//   // 🔥 lấy danh sách variantId từ cart
//   const variantIds = cart.items.map((item) => item.variantId);

//   // 🔥 query variant
//   const variants = await ProductVariant.find({
//     _id: { $in: variantIds },
//   });

//   // dùng map để duyệt qua từng variant khi đã query từ db
//   const variantMap = new Map();
//   variants.forEach((v) => {
//     variantMap.set(v._id.toString(), v);
//   });

//   // duyệt từng sản phẩm trong giỏ hàng và kiểm tra xem có tồn tại không
//   cart.items.forEach((item) => {
//     const variant = variantMap.get(item.variantId.toString());

//     if (!variant) {
//       item.isAvailable = false;
//     } else {
//       item.isAvailable = variant.stock > 0 && variant.isActive !== false;
//     }
//   });

//   return cart;
// };

export const getCart = async (userId) => {
  // 1. Lấy tất cả các dòng giỏ hàng của user này
  // Dùng .populate("variantId") để lấy thông tin sản phẩm (tên, giá, ảnh...) trực tiếp từ bảng ProductVariant
  const cartItems = await Cart.find({ userId }).populate({
    path: 'variantId',
    populate:[{ path: 'productId',  model: 'Product'  }, 
      { 
        path: 'attributes.attributeValueId', // Populate vào đường dẫn này
        model: 'AttributeValue'             // Tên model chứa giá trị (ví dụ: 'Đen', '256GB')
      }]  // Tên model cha của bạn 
   
  });

  // 2. Xử lý trường hợp không có sản phẩm nào trong giỏ
  if (!cartItems || cartItems.length === 0) {
    return {
      userId,
      items: [], // Trả về cấu trúc giống cũ để frontend không bị lỗi
    };
  }

  // 3. Xử lý logic isAvailable và định dạng lại dữ liệu
  const formattedItems = cartItems.map((item) => {
    const variant = item.variantId; // Sau khi populate, đây là object variant
    const product = variant?.productId; // Lấy thông tin từ bảng cha Product
    // Gộp tất cả các giá trị thuộc tính thành một chuỗi
    const attributesString = variant?.attributes
      .map(attr => attr.attributeValueId?.value) // Giả sử model AttributeValue có trường 'value'
      .join(" / ");

    console.log("DEBUG VARIANT:", variant); // Kiểm tra log này ở terminal Backend

    // Logic kiểm tra tình trạng hàng
    const isAvailable = variant && variant.stock > 0 && variant.isActive !== false;

    // Trả về object chứa thông tin cần thiết
    return {
      variantId: variant._id,
      productId: product?._id, // <--- THÊM DÒNG NÀY VÀO ĐÂY
      quantity: item.quantity,
      isAvailable: !!isAvailable,
      // Nếu frontend cần thêm thông tin (tên, giá, hình ảnh), bạn có thể lấy từ variant
      name: product ? product.name : "Sản phẩm không xác định", // <--- Lấy name từ đâ
      price: variant ? variant.price : 0,
      image: variant ? variant.image : null,
     variantName: attributesString || variant?.sku, // Ưu tiên hiển thị thuộc tính, nếu không có thì hiện SKU
     compareAtPrice: variant?.compareAtPrice || null,
    };
  });

  return {
    userId,
    items: formattedItems,
  };
};

// export const updateQuantity = async (userId, variantId, quantity) => {
//   // 1. validate
//   if (!variantId) {
//     throw new Error("Thiếu variantId");
//   }

//   // lấy giỏ hàng theo userId
//   const cart = await Cart.findOne({ userId });

//   // nếu user kh có giỏ hàng thì báo lỗi
//   if (!cart) {
//     throw new Error("Cart không tồn tại");
//   }

//   // lấy từng item có trong giỏ hàng vì items là 1 list danh sách các sản phẩm có trong giỏ hàng
//   const item = cart.items.find((i) => i.variantId.equals(variantId));

//   // nếu kh có sản phẩm đó thì báo sản phẩm kh có trong giỏ hàng
//   if (!item) {
//     throw new Error("Sản phẩm không có trong giỏ hàng");
//   }

//   // 4. nếu quantity <= 0 → xoá item
//   if (quantity <= 0) {
//     cart.items = cart.items.filter((i) => !i.variantId.equals(variantId));

//     await cart.save();
//     return cart;
//   }

//   // 5. lấy variant từ DB để check stock
//   const variant = await ProductVariant.findById(variantId);

//   if (!variant) {
//     throw new Error("Variant không tồn tại");
//   }

//   if (quantity > variant.stock) {
//     throw new Error("Không đủ hàng trong kho");
//   }

//   // 6. update quantity
//   item.quantity = quantity;

//   await cart.save();

//   return cart;
// };

export const updateQuantity = async (userId, variantId, quantity) => {
  // 1. Validate
  if (!variantId) {
    throw new Error("Thiếu variantId");
  }

  // 2. Tìm trực tiếp bản ghi của sản phẩm đó trong giỏ hàng của user
  // Thay vì lấy cả giỏ rồi tìm trong mảng, ta truy vấn thẳng vào database
  const cartItem = await Cart.findOne({ userId, variantId });

  // 3. Nếu không tìm thấy → sản phẩm không có trong giỏ hàng
  if (!cartItem) {
    throw new Error("Sản phẩm không có trong giỏ hàng");
  }

  // 4. Nếu quantity <= 0 → xoá bản ghi đó khỏi database
  if (quantity <= 0) {
    await Cart.findOneAndDelete({ userId, variantId });
    return null; // Hoặc trả về thông báo đã xóa thành công
  }

  // 5. Lấy variant từ DB để check stock
  const variant = await ProductVariant.findById(variantId);
  if (!variant) {
    throw new Error("Variant không tồn tại");
  }

  if (quantity > variant.stock) {
    throw new Error("Không đủ hàng trong kho");
  }

  // 6. Update quantity trực tiếp vào bản ghi
  cartItem.quantity = quantity;
  await cartItem.save();

  return cartItem;
};

// export const deleteItem = async (variantId, userId) => {
//   if (!variantId) {
//     throw new Error("Thiếu variantId");
//   }

//   const cart = await Cart.findOne({ userId });

//   if (!cart) {
//     throw new Error("giỏ hàng không tồn tại");
//   }

//   // so sánh variantId từ cart và variantId từ client truyền vào
//   const item = cart.items.find((p) => p.variantId.equals(variantId));

//   if (!item) {
//     throw new Error("Sản phẩm không có trong giỏ hàng");
//   }

//   // dùng filter để xóa item
//   cart.items = cart.items.filter((i) => !i.variantId.equals(variantId));

//   await cart.save();

//   return cart;
// };


export const deleteItem = async (variantId, userId) => {
  if (!variantId) {
    throw new Error("Thiếu variantId");
  }

  // 1. Dùng findOneAndDelete để xóa trực tiếp bản ghi từ database
  // Điều kiện: đúng User đó và đúng Variant đó
  const deletedItem = await Cart.findOneAndDelete({ userId, variantId });

  // 2. Nếu không tìm thấy bản ghi nào để xóa, có nghĩa là sản phẩm không có trong giỏ
  if (!deletedItem) {
    throw new Error("Sản phẩm không có trong giỏ hàng");
  }

  // 3. Trả về thông báo thành công hoặc object đã xóa
  return { message: "Đã xóa sản phẩm khỏi giỏ hàng", deletedItem };
};

// export const clearCart = async (userId) => {
//   const cart = await Cart.findOne({ userId });

//   if (!cart) {
//     throw new Error("Giỏ hàng không tồn tại");
//   }

//   cart.items = [];

//   await cart.save();

//   return cart;
// };

export const clearCart = async (userId) => {
  // Xóa toàn bộ các bản ghi trong collection Cart có userId khớp với user đang thao tác
  const result = await Cart.deleteMany({ userId });

  // Nếu muốn kiểm tra xem trước đó có giỏ hàng hay không (tùy nhu cầu logic của bạn)
  if (result.deletedCount === 0) {
    throw new Error("Giỏ hàng của bạn đang trống, không có gì để xóa");
  }

  return { message: "Đã xóa toàn bộ giỏ hàng thành công" };
};

export const updateCartVariant = async (userId, oldVariantId, newVariantId) => {
  // 1. Kiểm tra tồn tại
  console.log("DEBUG: Đang tìm với:", { userId, variantId: oldVariantId });
  const oldItem = await Cart.findOne({ userId, variantId: oldVariantId });
  console.log("DEBUG: Kết quả tìm thấy:", oldItem);
  const newVariant = await ProductVariant.findById(newVariantId);

  if (!oldItem) throw new Error("Sản phẩm cũ không có trong giỏ");
  if (!newVariant) throw new Error("Biến thể mới không tồn tại");

  // 2. Kiểm tra xem trong giỏ đã có sẵn biến thể MỚI chưa?
  // Nếu đã có, ta gộp số lượng vào đó và xóa biến thể cũ đi
  const existingNewItem = await Cart.findOne({ userId, variantId: newVariantId });

  if (existingNewItem) {
    // Gộp số lượng
    const totalQuantity = existingNewItem.quantity + oldItem.quantity;
    
    // Kiểm tra kho
    if (totalQuantity > newVariant.stock) {
      throw new Error("Tổng số lượng vượt quá tồn kho");
    }

    // Cập nhật record mới và xóa record cũ
    existingNewItem.quantity = totalQuantity;
    await existingNewItem.save();
    await Cart.findOneAndDelete({ userId, variantId: oldVariantId });
    
    return existingNewItem;
  } else {
    // 3. Nếu chưa có, đơn giản là cập nhật variantId của bản ghi cũ
    // (Lưu ý: nên update cả productId nếu bạn có lưu trong bảng Cart)
    oldItem.variantId = newVariantId;
    oldItem.productId = newVariant.productId; // Đảm bảo productId được cập nhật theo
    await oldItem.save();
    
    return oldItem;
  }
};