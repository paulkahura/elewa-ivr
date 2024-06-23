import { ItalBreadCrumbModule } from '@app/elements/layout/ital-bread-crumb';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';

import { FlexLayoutModule, MaterialDesignModule } from '@iote/bricks-angular';
import { MultiLangModule } from '@ngfi/multi-lang';

import { ConvlPageModule } from '@app/elements/layout/page-convl';
import { BotActionsModule } from '@app/features/convs-mgr/stories/bot-actions';
import { ChatsRouterModule } from '@app/features/convs-mgr/conversations/chats';

import { BotsListHeaderComponent } from './components/bots/bots-list-header/bots-list-header.component';
import { BotsListAllCoursesComponent } from './components/bots/bots-list-all-courses/bots-list-all-courses.component';
import { BotsListLatestCoursesComponent } from './components/bots/bots-list-latest-courses/bots-list-latest-courses.component';

import { CoursesListComponent } from './components/courses/courses-list/courses-list.component';

import { BotPageComponent } from './pages/bot-page/bot-page.component';
import { StoriesDashboardComponent } from './pages/stories-dashboard/stories-dashboard.component';
import { CoursesViewAllPageComponent } from './pages/courses-view-all-page/courses-view-all-page.component';

import { ConvsMgrStoriesRouterModule } from './stories.router';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialDesignModule,
    FlexLayoutModule,
    ConvlPageModule,
    MultiLangModule,
    ConvsMgrStoriesRouterModule,
    ChatsRouterModule,
    MatStepperModule,
    FormsModule,
    ItalBreadCrumbModule,
    BotActionsModule
  ],
  declarations: [
    StoriesDashboardComponent,
    BotsListHeaderComponent,
    BotsListLatestCoursesComponent,
    BotsListAllCoursesComponent,
    BotPageComponent,
    CoursesViewAllPageComponent,
    CoursesListComponent
  ]
})
export class ConvsMgrStoriesHomeModule {}
