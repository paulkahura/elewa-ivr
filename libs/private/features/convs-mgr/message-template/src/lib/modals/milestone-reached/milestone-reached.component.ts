import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Story } from '@app/model/convs-mgr/stories/main';
import { EventBlock } from '@app/model/convs-mgr/stories/blocks/messaging';
import { Dialog } from '@angular/cdk/dialog';
import { Observable, map } from 'rxjs';
import { StoryBlock } from '@app/model/convs-mgr/stories/blocks/main';
import { StoriesStore } from '@app/state/convs-mgr/stories';
import { StoryBlocksStore } from '@app/state/convs-mgr/stories/blocks';
import { SubSink } from 'subsink';

@Component({
  selector: 'app-milestone-reached',
  templateUrl: './milestone-reached.component.html',
  styleUrls: ['./milestone-reached.component.scss'],
})
export class MilestoneReachedComponent implements OnInit, OnDestroy{
  @Output() milestoneSelected = new EventEmitter<{
    milestoneType: string;
    selectedStory: Story;
    selectedMilestone: EventBlock;
  }>();

  stories$: Observable<Story[]>;
  story: Story;
  blocks$: Observable<StoryBlock[]>;
  _sBS: SubSink;

  selectedMilestoneType: string; // Variable to hold the selected milestone type
  selectedMilestone: EventBlock; // Variable to hold the selected milestone

  constructor(
    private _stories$$: StoriesStore,
    private _dialog: Dialog,
    private _storyBlockStore: StoryBlocksStore
  ) {
    this.stories$ = this._stories$$.get();
  }

  ngOnInit(): void {
      
  }

  selectedBot() {
    const storyId = this.story.id!;
    this.blocks$ = this._storyBlockStore
      .getBlocksByStory(storyId, this.story.orgId)
      .pipe(
        map((b) => b.filter((block) => block.type === 30)),
        map((b) => b.filter((block: EventBlock) => block.isMilestone))
      );
  }

  onSaveClick() {
    const milestoneType = this.selectedMilestoneType;
    const selectedStory = this.story;
    const selectedMilestone = this.selectedMilestone;

    // Emit the selected options to the parent component
    this.milestoneSelected.emit({
      milestoneType,
      selectedStory,
      selectedMilestone,
    });
    console.log("here")
    this._dialog.closeAll(); // Close the modal
  }
  closeModal(){
    this._dialog.closeAll();
  }
  ngOnDestroy(): void {
      // this._sBS.unsubscribe();
  }
}
