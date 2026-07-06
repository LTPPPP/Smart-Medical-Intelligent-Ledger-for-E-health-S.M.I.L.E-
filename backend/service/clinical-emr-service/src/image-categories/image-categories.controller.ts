import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ImageCategoriesService } from './image-categories.service';
import { CreateImageCategoryDto } from './dto/create-image-category.dto';
import { UpdateImageCategoryDto } from './dto/update-image-category.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Dental Images')
@Controller('image-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImageCategoriesController {
  constructor(
    private readonly imageCategoriesService: ImageCategoriesService,
  ) {}

  @Roles(RoleEnum.ADMIN)
  @Post()
  create(@Body() createImageCategoryDto: CreateImageCategoryDto) {
    return this.imageCategoriesService.create(createImageCategoryDto);
  }

  @Get()
  findAll() {
    return this.imageCategoriesService.findAll();
  }

  @Get(':category_id')
  findOne(@Param('category_id', ParseUUIDPipe) category_id: string) {
    return this.imageCategoriesService.findOne(category_id);
  }

  @Get('name/:category_name')
  findByName(@Param('category_name') category_name: string) {
    return this.imageCategoriesService.findByName(category_name);
  }

  @Roles(RoleEnum.ADMIN)
  @Patch(':category_id')
  update(
    @Param('category_id', ParseUUIDPipe) category_id: string,
    @Body() updateImageCategoryDto: UpdateImageCategoryDto,
  ) {
    return this.imageCategoriesService.update(
      category_id,
      updateImageCategoryDto,
    );
  }

  @Roles(RoleEnum.ADMIN)
  @Delete(':category_id')
  remove(@Param('category_id', ParseUUIDPipe) category_id: string) {
    return this.imageCategoriesService.remove(category_id);
  }
}
