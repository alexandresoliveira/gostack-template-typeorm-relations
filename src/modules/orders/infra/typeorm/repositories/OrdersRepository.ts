import { getRepository, Repository } from 'typeorm';

import IOrdersRepository from '@modules/orders/repositories/IOrdersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../entities/Order';
import OrdersProducts from '../entities/OrdersProducts';

class OrdersRepository implements IOrdersRepository {
  private ormRepository: Repository<Order>;

  constructor() {
    this.ormRepository = getRepository(Order);
  }

  public async create({ customer, products }: ICreateOrderDTO): Promise<Order> {
    const order = this.ormRepository.create({ customer, order_products: [] });
    const ordersProductsRepository = getRepository(OrdersProducts);
    products.forEach(p => {
      const orderProduct = ordersProductsRepository.create({
        order_id: order.id,
        product_id: p.product_id,
        price: p.price,
        quantity: p.quantity,
      });
      order.order_products.push(orderProduct);
    });
    await this.ormRepository.save(order);
    return order;
  }

  public async findById(id: string): Promise<Order | undefined> {
    // const order = await this.ormRepository.findOne(id);
    const order = await this.ormRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.order_products', 'orders_products')
      .where({ id })
      .getOne();
    return order;
  }
}

export default OrdersRepository;
