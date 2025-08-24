import { CreateSupplierDto } from '../../dto/create-supplier.dto';

export function makeSupplierDto(overrides: Partial<CreateSupplierDto> = {}): CreateSupplierDto {
  return {
    name: 'ABC Ltd',
    contact: '0771234567',
    brand: 'Stationery',
    email: 'abc@gmail.com',
    address: '123 Main Street, Colombo',
    location: 'Colombo',
    status: undefined, // optional
    ...overrides, // allow custom overrides
  };
}
