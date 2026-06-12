import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import ProductVariant from "../models/ProductVariant.js";

export const addToCart = async (userId, variantId, quantity) => {
  // check quantity
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity không hợp lệ");
  }

  // tìm sản phẩm có variantId từ client req
  const variant =
    await ProductVariant.findById(variantId).populate("productId");

  // kiểm tra có sản phẩm đó không
  if (!variant) {
    throw new Error("Variant không tồn tại");
  }

  // dữ liệu sản phẩm lấy thông qua variant populate (productId)
  const product = variant.productId;

  // check stock
  if (variant.stock < quantity) {
    throw new Error("Không đủ hàng");
  }
  //tìm giỏ hàng theo userID
  let cart = await Cart.findOne({ userId });

  // nếu userID chưa có giỏ hàng thì tạo mới giỏ hàng cho userId
  if (!cart) {
    cart = await Cart.create({
      userId,

      items: [
        {
          productId: product._id,
          variantId: variant._id,
          sku: variant.sku,
          name: product.name,
          image: variant.image || product.image,
          attributes: variant.attributes,
          price: variant.price,
          quantity,
        },
      ],
    });

    return cart;
  }

  // kiểm tra sản phẩm đã có trong cart chưa
  const itemIndex = cart.items.findIndex(
    (item) => item.variantId.toString() === variantId,
  );

  // đã có thì tăng quantity
  if (itemIndex > -1) {
    // đã có → update quantity (có check stock)
    const newQuantity = cart.items[itemIndex].quantity + quantity;

    if (newQuantity > variant.stock) {
      throw new Error("Vượt quá số lượng tồn kho");
    }

    cart.items[itemIndex].quantity = newQuantity;
  } else {
    // chưa có → thêm mới
    cart.items.push({
      productId: product._id,
      variantId: variant._id,
      sku: variant.sku,
      name: product.name,
      image: variant.image || product.image,
      attributes: variant.attributes,
      price: variant.price,
      quantity,
    });
  }

  // lưu giỏ hàng
  await cart.save();

  return cart;
};

export const getCart = async (userId) => {
  // lấy cart của user
  const cart = await Cart.findOne({ userId });

  // xử lí cart rỗng
  if (!cart) {
    return {
      userId,
      items: [],
    };
  }

  // 🔥 lấy danh sách variantId từ cart
  const variantIds = cart.items.map((item) => item.variantId);

  // 🔥 query variant
  const variants = await ProductVariant.find({
    _id: { $in: variantIds },
  });

  // dùng map để duyệt qua từng variant khi đã query từ db
  const variantMap = new Map();
  variants.forEach((v) => {
    variantMap.set(v._id.toString(), v);
  });

  // duyệt từng sản phẩm trong giỏ hàng và kiểm tra xem có tồn tại không
  cart.items.forEach((item) => {
    const variant = variantMap.get(item.variantId.toString());

    if (!variant) {
      item.isAvailable = false;
    } else {
      item.isAvailable = variant.stock > 0 && variant.isActive !== false;
    }
  });

  return cart;
};

export const updateQuantity = async (userId, variantId, quantity) => {
  // 1. validate
  if (!variantId) {
    throw new Error("Thiếu variantId");
  }

  // lấy giỏ hàng theo userId
  const cart = await Cart.findOne({ userId });

  // nếu user kh có giỏ hàng thì báo lỗi
  if (!cart) {
    throw new Error("Cart không tồn tại");
  }

  // lấy từng item có trong giỏ hàng vì items là 1 list danh sách các sản phẩm có trong giỏ hàng
  const item = cart.items.find((i) => i.variantId.equals(variantId));

  // nếu kh có sản phẩm đó thì báo sản phẩm kh có trong giỏ hàng
  if (!item) {
    throw new Error("Sản phẩm không có trong giỏ hàng");
  }

  // 4. nếu quantity <= 0 → xoá item
  if (quantity <= 0) {
    cart.items = cart.items.filter((i) => !i.variantId.equals(variantId));

    await cart.save();
    return cart;
  }

  // 5. lấy variant từ DB để check stock
  const variant = await ProductVariant.findById(variantId);

  if (!variant) {
    throw new Error("Variant không tồn tại");
  }

  if (quantity > variant.stock) {
    throw new Error("Không đủ hàng trong kho");
  }

  // 6. update quantity
  item.quantity = quantity;

  await cart.save();

  return cart;
};

export const deleteItem = async (variantId, userId) => {
  if (!variantId) {
    throw new Error("Thiếu variantId");
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("giỏ hàng không tồn tại");
  }

  // so sánh variantId từ cart và variantId từ client truyền vào
  const item = cart.items.find((p) => p.variantId.equals(variantId));

  if (!item) {
    throw new Error("Sản phẩm không có trong giỏ hàng");
  }

  // dùng filter để xóa item
  cart.items = cart.items.filter((i) => !i.variantId.equals(variantId));

  await cart.save();

  return cart;
};

export const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    throw new Error("Giỏ hàng không tồn tại");
  }

  cart.items = [];

  await cart.save();

  return cart;
};
