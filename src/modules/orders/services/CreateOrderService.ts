import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import ICreateOrderDTO from '@modules/orders/dtos/ICreateOrderDTO';
import IOrdersRepository from '../repositories/IOrdersRepository';

import Order from '../infra/typeorm/entities/Order';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const isExistsCustomers = await this.customersRepository.findById(
      customer_id,
    );

    if (!isExistsCustomers) {
      throw new AppError('Customer not found!');
    }

    try {
      const productsAvailable = await this.productsRepository.findAllById(
        products,
      );

      if (productsAvailable.length <= 0) {
        throw new Error();
      }

      const createOrder: ICreateOrderDTO = {
        customer: isExistsCustomers,
        products: [],
      };

      products.forEach(p => {
        const foundProduct = productsAvailable.find(po => po.id === p.id);
        if (foundProduct) {
          if (p.quantity > foundProduct.quantity) {
            throw new Error('Insuficient quantity!');
          }
          createOrder.products.push({
            product_id: p.id,
            price: foundProduct.price,
            quantity: p.quantity,
          });
          foundProduct.quantity -= p.quantity;
        }
      });

      const order = await this.ordersRepository.create(createOrder);

      if (order) {
        await this.productsRepository.updateQuantity(productsAvailable);
      }

      return order;
    } catch (err) {
      throw new AppError('Existing products in your list when not found', 400);
    }
  }
}

export default CreateOrderService;
